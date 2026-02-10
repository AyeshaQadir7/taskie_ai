"""
Load Testing Configuration (T071)

Simulates realistic load on the chat API using locust.
To run: pip install locust && locust -f load_test.py --host http://localhost:8000
"""

from locust import HttpUser, task, between
import random
import os
import json


class ChatUser(HttpUser):
    """Simulates a user interacting with the chat API"""

    wait_time = between(1, 3)  # Wait 1-3 seconds between requests

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.user_id = f"load_test_user_{random.randint(1, 100)}"
        self.conversation_id = None
        self.auth_token = os.getenv("TEST_AUTH_TOKEN", "test-token-12345")

    def on_start(self):
        """Called when a user starts - create initial conversation"""
        response = self.client.post(
            f"/api/{self.user_id}/chat",
            headers={"Authorization": f"Bearer {self.auth_token}"},
            json={"message": "Hello, load test starting"},
            name="/api/{user_id}/chat [new_conversation]"
        )
        if response.status_code == 200:
            self.conversation_id = response.json()['conversation_id']

    @task(3)
    def send_message(self):
        """Send a message to the conversation (3x weight)"""
        if not self.conversation_id:
            self.on_start()
            return

        messages = [
            "What can you help me with?",
            "Tell me about your capabilities",
            "Can you help me write code?",
            "What is machine learning?",
            "Explain this concept",
        ]

        response = self.client.post(
            f"/api/{self.user_id}/chat",
            headers={"Authorization": f"Bearer {self.auth_token}"},
            json={
                "message": random.choice(messages),
                "conversation_id": self.conversation_id
            },
            name="/api/{user_id}/chat [send_message]"
        )

    @task(2)
    def get_history(self):
        """Fetch conversation history (2x weight)"""
        if not self.conversation_id:
            self.on_start()
            return

        response = self.client.get(
            f"/api/{self.user_id}/conversations/{self.conversation_id}/history",
            headers={"Authorization": f"Bearer {self.auth_token}"},
            name="/api/{user_id}/conversations/{id}/history"
        )

    @task(1)
    def list_conversations(self):
        """List user's conversations (1x weight)"""
        response = self.client.get(
            f"/api/{self.user_id}/conversations?skip=0&limit=20",
            headers={"Authorization": f"Bearer {self.auth_token}"},
            name="/api/{user_id}/conversations"
        )

    @task(1)
    def new_conversation(self):
        """Start a new conversation (1x weight)"""
        response = self.client.post(
            f"/api/{self.user_id}/chat",
            headers={"Authorization": f"Bearer {self.auth_token}"},
            json={"message": "Starting new conversation in load test"},
            name="/api/{user_id}/chat [new_conversation]"
        )
        if response.status_code == 200:
            self.conversation_id = response.json()['conversation_id']


# Load test profile definitions
class SmallLoad(ChatUser):
    """Small load: 10 concurrent users"""
    wait_time = between(2, 5)


class MediumLoad(ChatUser):
    """Medium load: 50 concurrent users"""
    wait_time = between(1, 3)


class HighLoad(ChatUser):
    """High load: 100+ concurrent users"""
    wait_time = between(0.5, 1.5)


class SpikeTest(ChatUser):
    """Spike test: Sudden traffic spike"""
    wait_time = between(0.1, 0.5)


"""
Load Test Scenarios:

1. Small Load Test (10 users for 5 minutes):
   locust -f load_test.py --users 10 --spawn-rate 1 --run-time 5m

2. Medium Load Test (50 users for 10 minutes):
   locust -f load_test.py --users 50 --spawn-rate 5 --run-time 10m

3. High Load Test (100 users for 15 minutes):
   locust -f load_test.py --users 100 --spawn-rate 10 --run-time 15m

4. Spike Test (sudden spike to 200 users):
   locust -f load_test.py --users 200 --spawn-rate 50 --run-time 5m

5. Stress Test (increasing load until failure):
   locust -f load_test.py --users 500 --spawn-rate 50 --run-time 30m

Expected Results:
- Response times should remain < 2s for p95
- Success rate should be > 95%
- No database connection pool exhaustion
- Memory should not leak over time
"""
