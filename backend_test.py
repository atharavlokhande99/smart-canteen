import requests
import sys
import json
from datetime import datetime, timedelta

class SmartCanteenAPITester:
    def __init__(self, base_url="https://food-slot-booking.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.staff_token = None
        self.student_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            if not success:
                details += f", Expected: {expected_status}"
                try:
                    error_data = response.json()
                    details += f", Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f", Response: {response.text[:100]}"

            self.log_test(name, success, details)
            return success, response.json() if success and response.content else {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_basic_endpoints(self):
        """Test basic API endpoints"""
        print("\n🔍 Testing Basic Endpoints...")
        
        # Test root endpoint
        self.run_test("API Root", "GET", "", 200)
        
        # Test menu endpoint (should work without auth)
        self.run_test("Get Menu", "GET", "menu", 200)

    def test_authentication(self):
        """Test authentication flows"""
        print("\n🔍 Testing Authentication...")
        
        # Test admin login
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@canteen.com", "password": "admin123"}
        )
        if success and 'token' in response:
            self.admin_token = response['token']
        
        # Test staff login
        success, response = self.run_test(
            "Staff Login",
            "POST",
            "auth/login",
            200,
            data={"email": "staff@canteen.com", "password": "staff123"}
        )
        if success and 'token' in response:
            self.staff_token = response['token']
        
        # Test student registration (create test student)
        test_email = f"test_student_{datetime.now().strftime('%H%M%S')}@test.com"
        success, response = self.run_test(
            "Student Registration",
            "POST",
            "auth/register",
            200,
            data={
                "email": test_email,
                "password": "test123",
                "name": "Test Student",
                "role": "student"
            }
        )
        if success and 'token' in response:
            self.student_token = response['token']

    def test_protected_endpoints(self):
        """Test endpoints that require authentication"""
        print("\n🔍 Testing Protected Endpoints...")
        
        if not self.admin_token:
            print("❌ No admin token available, skipping admin tests")
            return
        
        admin_headers = {"Authorization": f"Bearer {self.admin_token}"}
        staff_headers = {"Authorization": f"Bearer {self.staff_token}"}
        student_headers = {"Authorization": f"Bearer {self.student_token}"}
        
        # Test /auth/me endpoint
        self.run_test("Get Current User (Admin)", "GET", "auth/me", 200, headers=admin_headers)
        
        # Test admin analytics
        self.run_test("Admin Analytics", "GET", "admin/analytics", 200, headers=admin_headers)
        
        # Test admin users list
        self.run_test("Admin Users List", "GET", "admin/users", 200, headers=admin_headers)
        
        # Test staff endpoints
        if self.staff_token:
            self.run_test("Staff Get All Orders", "GET", "orders/all", 200, headers=staff_headers)
            self.run_test("Staff Get All Slots", "GET", "slots/all", 200, headers=staff_headers)
        
        # Test student endpoints
        if self.student_token:
            self.run_test("Student Get Available Slots", "GET", "slots", 200, headers=student_headers)
            self.run_test("Student Get My Orders", "GET", "orders/my", 200, headers=student_headers)

    def test_time_slot_management(self):
        """Test time slot creation and management"""
        print("\n🔍 Testing Time Slot Management...")
        
        if not self.staff_token:
            print("❌ No staff token available, skipping slot tests")
            return
        
        staff_headers = {"Authorization": f"Bearer {self.staff_token}"}
        
        # Create a test time slot
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        slot_data = {
            "date": tomorrow,
            "start_time": "14:00",
            "end_time": "14:30",
            "max_orders": 5
        }
        
        success, response = self.run_test(
            "Create Time Slot",
            "POST",
            "slots",
            200,
            data=slot_data,
            headers=staff_headers
        )
        
        if success and 'slot_id' in response:
            slot_id = response['slot_id']
            
            # Test toggle slot
            self.run_test(
                "Toggle Time Slot",
                "PUT",
                f"slots/{slot_id}/toggle",
                200,
                headers=staff_headers
            )
            
            # Test delete slot
            self.run_test(
                "Delete Time Slot",
                "DELETE",
                f"slots/{slot_id}",
                200,
                headers=staff_headers
            )

    def test_order_flow(self):
        """Test order creation flow (without payment)"""
        print("\n🔍 Testing Order Flow...")
        
        if not self.student_token:
            print("❌ No student token available, skipping order tests")
            return
        
        student_headers = {"Authorization": f"Bearer {self.student_token}"}
        
        # Get available slots first
        success, slots_response = self.run_test(
            "Get Available Slots for Order",
            "GET",
            "slots",
            200,
            headers=student_headers
        )
        
        if success and slots_response.get('slots'):
            slot_id = slots_response['slots'][0]['slot_id']
            
            # Try to create an order (this will fail at Stripe but should create order)
            order_data = {
                "items": [{"item_id": "item_burger", "quantity": 1}],
                "slot_id": slot_id,
                "origin_url": "https://food-slot-booking.preview.emergentagent.com"
            }
            
            # This might fail due to Stripe integration, but we test the endpoint
            success, response = self.run_test(
                "Create Order (Test)",
                "POST",
                "orders",
                200,
                data=order_data,
                headers=student_headers
            )

    def test_seed_data(self):
        """Test seed data endpoint"""
        print("\n🔍 Testing Seed Data...")
        
        # Test seed endpoint (should be idempotent)
        self.run_test("Seed Data", "POST", "seed", 200)

    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting Smart Canteen API Tests...")
        print(f"Testing against: {self.base_url}")
        
        self.test_basic_endpoints()
        self.test_seed_data()
        self.test_authentication()
        self.test_protected_endpoints()
        self.test_time_slot_management()
        self.test_order_flow()
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        # Print failed tests
        failed_tests = [t for t in self.test_results if not t['success']]
        if failed_tests:
            print(f"\n❌ Failed Tests ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = SmartCanteenAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())