import requests
import time
import sys

def verify_backend():
    url = "http://127.0.0.1:8000/api/token/"
    data = {
        "username": "student",
        "password": "password123"
    }

    print(f"Attempting to connect to {url}...")

    # Retry loop to allow server to start
    for i in range(10):
        try:
            response = requests.post(url, json=data)
            print(f"Status Code: {response.status_code}")
            if response.status_code == 200:
                print("Success! Token received.")
                print(response.json().keys())
                return
            else:
                print(f"Failed with status {response.status_code}")
                print(response.text)
                sys.exit(1)
        except requests.exceptions.ConnectionError:
            print(f"Connection refused (attempt {i+1}/10)... waiting")
            time.sleep(1)
        except Exception as e:
            print(f"Error: {e}")
            sys.exit(1)

    print("Could not connect to backend after multiple attempts.")
    sys.exit(1)

if __name__ == "__main__":
    verify_backend()
