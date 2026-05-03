
import superjson from 'superjson';

async function test() {
  const url = 'http://127.0.0.1:3000/api/trpc/auth.login?batch=1';
  const payload = {
    "0": {
      "json": {
        "email": "ssripada16@gmail.com",
        "password": "admin" // I'll assume the password is 'admin' or something common for now to test the reachability
      }
    }
  };

  console.log("Fetching:", url);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const text = await res.text();
    console.log("Response status:", res.status);
    console.log("Response text:", text);
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

test();
