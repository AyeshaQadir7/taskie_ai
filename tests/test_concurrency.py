"""
Concurrency Testing (T069)

Test system behavior under concurrent load with multiple users
and conversation interactions happening simultaneously.
"""

import pytest
import asyncio
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from fastapi.testclient import TestClient
from typing import List, Dict, Any

pytestmark = pytest.mark.integration


class TestConcurrency:
    """T069: Concurrency Testing

    Validates system behavior with:
    - Multiple concurrent users
    - Simultaneous message sends
    - Parallel conversation creation
    - Database transaction isolation
    """

    def test_concurrent_message_sends(self, client: TestClient, test_user, test_conversation):
        """Test multiple messages sent concurrently to same conversation"""

        def send_message(message_num: int) -> Dict[str, Any]:
            try:
                response = client.post(
                    f"/api/{test_user['id']}/chat",
                    headers={"Authorization": f"Bearer {test_user['token']}"},
                    json={
                        "message": f"Concurrent message {message_num}",
                        "conversation_id": test_conversation.id
                    }
                )
                return {
                    "status": response.status_code,
                    "message_num": message_num,
                    "success": response.status_code == 200
                }
            except Exception as e:
                return {
                    "status": 500,
                    "message_num": message_num,
                    "success": False,
                    "error": str(e)
                }

        # Send 10 messages concurrently
        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(send_message, i) for i in range(10)]
            results = [f.result() for f in as_completed(futures)]

        # All should succeed
        assert all(r['success'] for r in results), f"Some messages failed: {results}"
        assert len(results) == 10

        # Verify all messages are in history
        response = client.get(
            f"/api/{test_user['id']}/conversations/{test_conversation.id}/history",
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        assert response.status_code == 200
        history = response.json()['messages']

        # Count concurrent messages in history
        user_messages = [msg for msg in history if msg['role'] == 'user']
        concurrent_msgs = [msg for msg in user_messages if 'Concurrent message' in msg['content']]

        # Should have all 10 messages (plus any pre-existing)
        assert len(concurrent_msgs) >= 10

    def test_concurrent_conversation_creation(self, client: TestClient, test_user):
        """Test creating multiple conversations concurrently"""

        def create_conversation(user_id: str, conv_num: int) -> Dict[str, Any]:
            try:
                response = client.post(
                    f"/api/{user_id}/chat",
                    headers={"Authorization": f"Bearer {test_user['token']}"},
                    json={"message": f"First message in conversation {conv_num}"}
                )
                return {
                    "status": response.status_code,
                    "conv_num": conv_num,
                    "success": response.status_code == 200,
                    "conversation_id": response.json().get('conversation_id') if response.status_code == 200 else None
                }
            except Exception as e:
                return {
                    "status": 500,
                    "conv_num": conv_num,
                    "success": False,
                    "error": str(e)
                }

        # Create 10 conversations concurrently
        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(create_conversation, test_user['id'], i) for i in range(10)]
            results = [f.result() for f in as_completed(futures)]

        # All should succeed
        assert all(r['success'] for r in results), f"Some conversations failed: {results}"
        assert len(results) == 10

        # All conversation IDs should be unique
        conv_ids = [r['conversation_id'] for r in results if r['conversation_id']]
        assert len(conv_ids) == 10
        assert len(set(conv_ids)) == 10  # All unique

    def test_concurrent_history_reads(self, client: TestClient, test_user, test_conversation):
        """Test reading conversation history concurrently"""

        def read_history(read_num: int) -> Dict[str, Any]:
            try:
                response = client.get(
                    f"/api/{test_user['id']}/conversations/{test_conversation.id}/history",
                    headers={"Authorization": f"Bearer {test_user['token']}"}
                )
                return {
                    "status": response.status_code,
                    "read_num": read_num,
                    "success": response.status_code == 200,
                    "message_count": len(response.json().get('messages', [])) if response.status_code == 200 else 0
                }
            except Exception as e:
                return {
                    "status": 500,
                    "read_num": read_num,
                    "success": False,
                    "error": str(e)
                }

        # Read history 20 times concurrently
        with ThreadPoolExecutor(max_workers=20) as executor:
            futures = [executor.submit(read_history, i) for i in range(20)]
            results = [f.result() for f in as_completed(futures)]

        # All should succeed
        assert all(r['success'] for r in results), f"Some reads failed: {results}"
        assert len(results) == 20

        # All reads should return same message count (consistency)
        message_counts = [r['message_count'] for r in results if r['success']]
        assert len(set(message_counts)) == 1, f"Inconsistent reads: {message_counts}"

    def test_mixed_concurrent_operations(self, client: TestClient, test_user):
        """Test mixed concurrent operations: create, send, read, list"""

        results = {
            "create": [],
            "send": [],
            "read": [],
            "list": []
        }

        def create_conv():
            try:
                response = client.post(
                    f"/api/{test_user['id']}/chat",
                    headers={"Authorization": f"Bearer {test_user['token']}"},
                    json={"message": "Mixed test message"}
                )
                return response.status_code == 200, response.json().get('conversation_id')
            except:
                return False, None

        def send_to_conv(conv_id):
            try:
                response = client.post(
                    f"/api/{test_user['id']}/chat",
                    headers={"Authorization": f"Bearer {test_user['token']}"},
                    json={"message": "Mixed send", "conversation_id": conv_id}
                )
                return response.status_code == 200
            except:
                return False

        def read_history(conv_id):
            try:
                response = client.get(
                    f"/api/{test_user['id']}/conversations/{conv_id}/history",
                    headers={"Authorization": f"Bearer {test_user['token']}"}
                )
                return response.status_code == 200
            except:
                return False

        def list_convs():
            try:
                response = client.get(
                    f"/api/{test_user['id']}/conversations",
                    headers={"Authorization": f"Bearer {test_user['token']}"}
                )
                return response.status_code == 200
            except:
                return False

        with ThreadPoolExecutor(max_workers=20) as executor:
            futures = []

            # Create 5 conversations
            create_futures = [executor.submit(create_conv) for _ in range(5)]
            conv_results = [f.result() for f in create_futures]
            conv_ids = [cid for success, cid in conv_results if success and cid]
            results["create"] = [success for success, _ in conv_results]

            # Send messages to each
            for conv_id in conv_ids:
                futures.append(executor.submit(send_to_conv, conv_id))

            # Read histories
            for conv_id in conv_ids:
                futures.append(executor.submit(read_history, conv_id))

            # List conversations
            for _ in range(5):
                futures.append(executor.submit(list_convs))

            # Collect results
            for future in as_completed(futures):
                try:
                    future.result()
                except:
                    pass

        # Most operations should succeed (some may timeout but shouldn't crash)
        total_creates = sum(1 for r in results["create"] if r)
        assert total_creates >= 3, f"Too many create failures: {results}"

    def test_no_data_corruption_under_load(self, client: TestClient, test_user):
        """Test that concurrent operations don't cause data corruption"""

        # Create a conversation
        response = client.post(
            f"/api/{test_user['id']}/chat",
            headers={"Authorization": f"Bearer {test_user['token']}"},
            json={"message": "Initial message"}
        )
        assert response.status_code == 200
        conv_id = response.json()['conversation_id']

        # Add messages concurrently
        def add_and_read(num: int):
            # Send message
            client.post(
                f"/api/{test_user['id']}/chat",
                headers={"Authorization": f"Bearer {test_user['token']}"},
                json={"message": f"Message {num}", "conversation_id": conv_id}
            )

            # Immediately read
            response = client.get(
                f"/api/{test_user['id']}/conversations/{conv_id}/history",
                headers={"Authorization": f"Bearer {test_user['token']}"}
            )

            return response.status_code == 200 and len(response.json()['messages']) > 0

        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(add_and_read, i) for i in range(10)]
            results = [f.result() for f in as_completed(futures)]

        # All operations should succeed
        assert all(results), f"Some operations failed: {results}"

        # Final verification - get history and check integrity
        response = client.get(
            f"/api/{test_user['id']}/conversations/{conv_id}/history",
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        assert response.status_code == 200
        history = response.json()['messages']

        # Messages should be in chronological order
        timestamps = [msg['created_at'] for msg in history]
        assert timestamps == sorted(timestamps), "Messages not in chronological order"

        # All messages should be present
        assert len(history) >= 11  # Initial + 10 concurrent

    @pytest.mark.slow
    def test_high_concurrency_100_users(self, client: TestClient, test_user):
        """T069: Test with 100 concurrent simulated users"""

        def simulate_user_session(user_num: int) -> Dict[str, Any]:
            """Simulate one user creating conversation and sending message"""
            try:
                # Send message (creates conversation if not provided)
                response = client.post(
                    f"/api/{test_user['id']}/chat",
                    headers={"Authorization": f"Bearer {test_user['token']}"},
                    json={"message": f"User {user_num} message"}
                )

                if response.status_code != 200:
                    return {"user": user_num, "success": False, "error": f"Status {response.status_code}"}

                conv_id = response.json()['conversation_id']

                # Read history
                response = client.get(
                    f"/api/{test_user['id']}/conversations/{conv_id}/history",
                    headers={"Authorization": f"Bearer {test_user['token']}"}
                )

                return {
                    "user": user_num,
                    "success": response.status_code == 200,
                    "message_count": len(response.json()['messages'])
                }
            except Exception as e:
                return {"user": user_num, "success": False, "error": str(e)}

        # Simulate 100 concurrent users
        with ThreadPoolExecutor(max_workers=100) as executor:
            futures = [executor.submit(simulate_user_session, i) for i in range(100)]
            results = [f.result() for f in as_completed(futures)]

        # Calculate success rate
        successes = sum(1 for r in results if r['success'])
        success_rate = (successes / len(results)) * 100

        # Should have high success rate (>95%)
        assert success_rate >= 95, f"Success rate too low: {success_rate}% ({successes}/{len(results)})"

        print(f"\n✓ 100 concurrent users test: {success_rate:.1f}% success rate")
