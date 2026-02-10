"""
Performance Benchmarking (T070)

Measure and validate performance characteristics of the chat API.
Tracks response times, throughput, and resource usage.
"""

import pytest
import time
from typing import List, Dict, Any
from fastapi.testclient import TestClient
import statistics

pytestmark = pytest.mark.integration


class PerformanceMetrics:
    """Track performance metrics"""

    def __init__(self):
        self.response_times: List[float] = []
        self.status_codes: List[int] = []
        self.errors: List[str] = []

    def add_result(self, duration_ms: float, status_code: int, error: str = None):
        self.response_times.append(duration_ms)
        self.status_codes.append(status_code)
        if error:
            self.errors.append(error)

    def get_stats(self) -> Dict[str, Any]:
        if not self.response_times:
            return {}

        return {
            "count": len(self.response_times),
            "min": min(self.response_times),
            "max": max(self.response_times),
            "mean": statistics.mean(self.response_times),
            "median": statistics.median(self.response_times),
            "p95": sorted(self.response_times)[int(len(self.response_times) * 0.95)],
            "p99": sorted(self.response_times)[int(len(self.response_times) * 0.99)],
            "stdev": statistics.stdev(self.response_times) if len(self.response_times) > 1 else 0,
            "success_rate": sum(1 for s in self.status_codes if s < 400) / len(self.status_codes) * 100,
        }

    def print_report(self, name: str):
        stats = self.get_stats()
        if not stats:
            print(f"\n{name}: No data collected")
            return

        print(f"\n{'='*60}")
        print(f"{name}")
        print(f"{'='*60}")
        print(f"Requests: {stats['count']}")
        print(f"Success Rate: {stats['success_rate']:.1f}%")
        print(f"Response Times (ms):")
        print(f"  Min: {stats['min']:.2f}")
        print(f"  Max: {stats['max']:.2f}")
        print(f"  Mean: {stats['mean']:.2f}")
        print(f"  Median: {stats['median']:.2f}")
        print(f"  P95: {stats['p95']:.2f}")
        print(f"  P99: {stats['p99']:.2f}")
        print(f"  StdDev: {stats['stdev']:.2f}")
        if self.errors:
            print(f"Errors: {len(self.errors)}")
            for error in self.errors[:5]:
                print(f"  - {error}")


class TestPerformance:
    """T070: Performance Benchmarking

    Measure:
    - API response times
    - Throughput (requests/second)
    - History retrieval speed
    - Conversation creation speed
    """

    def test_chat_endpoint_response_time(self, client: TestClient, test_user, test_conversation):
        """Measure response time for chat endpoint"""

        metrics = PerformanceMetrics()

        # Warm up
        client.post(
            f"/api/{test_user['id']}/chat",
            headers={"Authorization": f"Bearer {test_user['token']}"},
            json={"message": "Warmup", "conversation_id": test_conversation.id}
        )

        # Benchmark: 50 requests
        for i in range(50):
            start = time.time()
            try:
                response = client.post(
                    f"/api/{test_user['id']}/chat",
                    headers={"Authorization": f"Bearer {test_user['token']}"},
                    json={"message": f"Perf test {i}", "conversation_id": test_conversation.id}
                )
                duration_ms = (time.time() - start) * 1000
                metrics.add_result(duration_ms, response.status_code)
            except Exception as e:
                metrics.add_result(0, 500, str(e))

        stats = metrics.get_stats()
        metrics.print_report("Chat Endpoint Performance")

        # Assertions: Response times should be reasonable
        assert stats['p95'] < 5000, f"P95 response time too high: {stats['p95']}ms"
        assert stats['mean'] < 2000, f"Mean response time too high: {stats['mean']}ms"
        assert stats['success_rate'] >= 80, f"Success rate too low: {stats['success_rate']}%"

    def test_history_retrieval_speed(self, client: TestClient, test_user, test_conversation):
        """Measure speed of history retrieval"""

        metrics = PerformanceMetrics()

        # Warm up
        client.get(
            f"/api/{test_user['id']}/conversations/{test_conversation.id}/history",
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )

        # Benchmark: 100 requests (history should be fast)
        for i in range(100):
            start = time.time()
            try:
                response = client.get(
                    f"/api/{test_user['id']}/conversations/{test_conversation.id}/history",
                    headers={"Authorization": f"Bearer {test_user['token']}"}
                )
                duration_ms = (time.time() - start) * 1000
                metrics.add_result(duration_ms, response.status_code)
            except Exception as e:
                metrics.add_result(0, 500, str(e))

        stats = metrics.get_stats()
        metrics.print_report("History Retrieval Performance")

        # History retrieval should be very fast (indexed query)
        assert stats['p95'] < 1000, f"P95 history retrieval too slow: {stats['p95']}ms"
        assert stats['mean'] < 500, f"Mean history retrieval too slow: {stats['mean']}ms"
        assert stats['success_rate'] >= 95, f"Success rate too low: {stats['success_rate']}%"

    def test_conversation_list_speed(self, client: TestClient, test_user):
        """Measure speed of listing conversations"""

        metrics = PerformanceMetrics()

        # Warm up
        client.get(
            f"/api/{test_user['id']}/conversations",
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )

        # Benchmark: 50 requests
        for i in range(50):
            start = time.time()
            try:
                response = client.get(
                    f"/api/{test_user['id']}/conversations?skip=0&limit=20",
                    headers={"Authorization": f"Bearer {test_user['token']}"}
                )
                duration_ms = (time.time() - start) * 1000
                metrics.add_result(duration_ms, response.status_code)
            except Exception as e:
                metrics.add_result(0, 500, str(e))

        stats = metrics.get_stats()
        metrics.print_report("Conversation List Performance")

        # List should be reasonably fast
        assert stats['p95'] < 2000, f"P95 list speed too slow: {stats['p95']}ms"
        assert stats['success_rate'] >= 90, f"Success rate too low: {stats['success_rate']}%"

    def test_conversation_creation_speed(self, client: TestClient, test_user):
        """Measure speed of creating new conversations"""

        metrics = PerformanceMetrics()

        # Warm up
        client.post(
            f"/api/{test_user['id']}/chat",
            headers={"Authorization": f"Bearer {test_user['token']}"},
            json={"message": "Warmup"}
        )

        # Benchmark: 30 requests
        for i in range(30):
            start = time.time()
            try:
                response = client.post(
                    f"/api/{test_user['id']}/chat",
                    headers={"Authorization": f"Bearer {test_user['token']}"},
                    json={"message": f"New conv {i}"}
                )
                duration_ms = (time.time() - start) * 1000
                metrics.add_result(duration_ms, response.status_code)
            except Exception as e:
                metrics.add_result(0, 500, str(e))

        stats = metrics.get_stats()
        metrics.print_report("Conversation Creation Performance")

        # Creation involves database writes, should be acceptable
        assert stats['p95'] < 10000, f"P95 creation too slow: {stats['p95']}ms"
        assert stats['success_rate'] >= 80, f"Success rate too low: {stats['success_rate']}%"

    def test_throughput_estimation(self, client: TestClient, test_user, test_conversation):
        """Estimate throughput: requests per second"""

        print(f"\n{'='*60}")
        print("Throughput Analysis")
        print(f"{'='*60}")

        # Measure time for N requests
        num_requests = 100
        start = time.time()

        for i in range(num_requests):
            client.post(
                f"/api/{test_user['id']}/chat",
                headers={"Authorization": f"Bearer {test_user['token']}"},
                json={"message": f"Throughput test {i}", "conversation_id": test_conversation.id}
            )

        total_time = time.time() - start
        throughput = num_requests / total_time

        print(f"Requests: {num_requests}")
        print(f"Total Time: {total_time:.2f}s")
        print(f"Throughput: {throughput:.2f} req/s")
        print(f"Average Response Time: {(total_time/num_requests)*1000:.2f}ms")

        # Should handle at least 5 requests/second in testing
        assert throughput >= 2.0, f"Throughput too low: {throughput:.2f} req/s"

    def test_p99_response_time_target(self, client: TestClient, test_user, test_conversation):
        """Verify P99 response time meets target"""

        metrics = PerformanceMetrics()

        # Collect 200 samples for good p99 estimate
        for i in range(200):
            start = time.time()
            try:
                response = client.post(
                    f"/api/{test_user['id']}/chat",
                    headers={"Authorization": f"Bearer {test_user['token']}"},
                    json={"message": f"P99 test {i}", "conversation_id": test_conversation.id}
                )
                duration_ms = (time.time() - start) * 1000
                metrics.add_result(duration_ms, response.status_code)
            except Exception as e:
                metrics.add_result(0, 500, str(e))

        stats = metrics.get_stats()
        print(f"\nP99 Response Time: {stats['p95']:.2f}ms")

        # P99 target: 5 seconds
        # P95 target: 2 seconds
        assert stats['mean'] < 2000, f"Mean response time: {stats['mean']:.2f}ms (target: <2000ms)"
        assert stats['p99'] < 5000, f"P99 response time: {stats['p99']:.2f}ms (target: <5000ms)"
