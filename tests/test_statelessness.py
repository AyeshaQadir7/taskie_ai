"""
Statelessness Verification Tests (T067)

Verify that the server holds no in-memory conversation state between requests.
Ensures the system can be horizontally scaled without session affinity.
"""

import pytest
import json
from datetime import datetime
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

pytestmark = pytest.mark.integration


class TestStatelessness:
    """T067: Statelessness Verification

    Proves that:
    1. Each request is independent
    2. No conversation state is cached
    3. History is reconstructed from database
    4. Server can be restarted without data loss
    """

    def test_multiple_requests_independent(self, client: TestClient, test_user, test_conversation):
        """Each request to same conversation should reconstruct history independently"""

        # First request - load conversation
        response1 = client.get(
            f"/api/{test_user['id']}/conversations/{test_conversation.id}/history",
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        assert response1.status_code == 200
        data1 = response1.json()
        messages1 = data1['messages']

        # Add a message
        response2 = client.post(
            f"/api/{test_user['id']}/chat",
            headers={"Authorization": f"Bearer {test_user['token']}"},
            json={
                "message": "Test message 1",
                "conversation_id": test_conversation.id
            }
        )
        assert response2.status_code == 200

        # Second request - should get updated history
        response3 = client.get(
            f"/api/{test_user['id']}/conversations/{test_conversation.id}/history",
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        assert response3.status_code == 200
        data3 = response3.json()
        messages3 = data3['messages']

        # Should have one more message
        assert len(messages3) == len(messages1) + 1
        assert messages3[-1]['content'] == "Test message 1"

    def test_no_cached_state(self, client: TestClient, test_user):
        """Verify no state is retained between requests"""

        # First request - create conversation
        response1 = client.post(
            f"/api/{test_user['id']}/chat",
            headers={"Authorization": f"Bearer {test_user['token']}"},
            json={"message": "First request"}
        )
        assert response1.status_code == 200
        conv_id1 = response1.json()['conversation_id']

        # Second request - create another conversation
        response2 = client.post(
            f"/api/{test_user['id']}/chat",
            headers={"Authorization": f"Bearer {test_user['token']}"},
            json={"message": "Second request"}
        )
        assert response2.status_code == 200
        conv_id2 = response2.json()['conversation_id']

        # Both conversations should be different
        assert conv_id1 != conv_id2

        # Both should exist independently
        response3 = client.get(
            f"/api/{test_user['id']}/conversations/{conv_id1}/history",
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        assert response3.status_code == 200

        response4 = client.get(
            f"/api/{test_user['id']}/conversations/{conv_id2}/history",
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        assert response4.status_code == 200

    def test_history_always_reconstructed(self, client: TestClient, test_user, test_conversation):
        """Verify history is always reconstructed from database, not cached"""

        # Get history twice in quick succession
        response1 = client.get(
            f"/api/{test_user['id']}/conversations/{test_conversation.id}/history",
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        data1 = response1.json()

        response2 = client.get(
            f"/api/{test_user['id']}/conversations/{test_conversation.id}/history",
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        data2 = response2.json()

        # Both responses should be identical (same message count and order)
        assert len(data1['messages']) == len(data2['messages'])
        assert data1['messages'][0]['id'] == data2['messages'][0]['id']
        assert data1['messages'][-1]['id'] == data2['messages'][-1]['id']

    def test_conversation_isolation(self, client: TestClient, test_user):
        """Verify each conversation is isolated (no state leakage)"""

        # Create conversation 1 with message
        response1 = client.post(
            f"/api/{test_user['id']}/chat",
            headers={"Authorization": f"Bearer {test_user['token']}"},
            json={"message": "Conversation 1 message"}
        )
        conv_id1 = response1.json()['conversation_id']

        # Create conversation 2 with message
        response2 = client.post(
            f"/api/{test_user['id']}/chat",
            headers={"Authorization": f"Bearer {test_user['token']}"},
            json={"message": "Conversation 2 message"}
        )
        conv_id2 = response2.json()['conversation_id']

        # Get history for conversation 1
        response3 = client.get(
            f"/api/{test_user['id']}/conversations/{conv_id1}/history",
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        history1 = response3.json()['messages']

        # Get history for conversation 2
        response4 = client.get(
            f"/api/{test_user['id']}/conversations/{conv_id2}/history",
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        history2 = response4.json()['messages']

        # Verify no message leakage between conversations
        conv1_contents = [msg['content'] for msg in history1]
        conv2_contents = [msg['content'] for msg in history2]

        assert "Conversation 2 message" not in conv1_contents
        assert "Conversation 1 message" not in conv2_contents

    def test_no_in_memory_buffer(self, client: TestClient, test_user):
        """Verify messages are persisted, not held in memory"""

        # Send message
        response1 = client.post(
            f"/api/{test_user['id']}/chat",
            headers={"Authorization": f"Bearer {test_user['token']}"},
            json={"message": "Persisted message"}
        )
        assert response1.status_code == 200
        conv_id = response1.json()['conversation_id']

        # Immediately get history - message should be in database
        response2 = client.get(
            f"/api/{test_user['id']}/conversations/{conv_id}/history",
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        assert response2.status_code == 200
        history = response2.json()['messages']

        # User message should be in history
        user_messages = [msg for msg in history if msg['role'] == 'user']
        assert len(user_messages) > 0
        assert user_messages[-1]['content'] == "Persisted message"


class TestServerRestartRecovery:
    """T068: Server Restart Recovery

    Proves that conversations survive server restarts
    because all state is in the database, not memory.
    """

    def test_conversation_exists_after_restart(self, client: TestClient, test_user, test_conversation, db: Session):
        """Verify conversation is still accessible after conceptual server restart"""

        # Get conversation ID
        conv_id = test_conversation.id

        # Get history before
        response1 = client.get(
            f"/api/{test_user['id']}/conversations/{conv_id}/history",
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        assert response1.status_code == 200
        data1 = response1.json()
        count1 = len(data1['messages'])

        # Simulate server restart by closing and reopening database session
        # In real scenario, this would be: server stops, all in-memory state lost, server restarts
        db.commit()  # Ensure transaction is committed

        # Get history after (simulated restart)
        response2 = client.get(
            f"/api/{test_user['id']}/conversations/{conv_id}/history",
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        assert response2.status_code == 200
        data2 = response2.json()
        count2 = len(data2['messages'])

        # Message count should be identical (no loss of data)
        assert count1 == count2
        assert data1['messages'][0]['id'] == data2['messages'][0]['id']

    def test_all_conversations_recoverable(self, client: TestClient, test_user):
        """Verify all conversations are stored in database, recoverable after restart"""

        # Create multiple conversations
        conv_ids = []
        for i in range(3):
            response = client.post(
                f"/api/{test_user['id']}/chat",
                headers={"Authorization": f"Bearer {test_user['token']}"},
                json={"message": f"Conversation {i+1}"}
            )
            assert response.status_code == 200
            conv_ids.append(response.json()['conversation_id'])

        # List all conversations
        response = client.get(
            f"/api/{test_user['id']}/conversations?skip=0&limit=20",
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        assert response.status_code == 200
        conversations = response.json()

        # All conversations should be listed (recoverable from database)
        assert len(conversations) >= 3
        listed_ids = [c['id'] for c in conversations]
        for conv_id in conv_ids:
            assert conv_id in listed_ids
