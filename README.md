<div align="center">
  <h1>🏛️ Oracle</h1>
  <h3>Municipal Grievance Analytics System</h3>
</div>

<br/>

## 🌆 The Problem

In modern cities, citizens constantly report issues—overflowing garbage, water shortages, and broken infrastructure. While this data is collected daily through portals and call centers, it too often simply remains stored, unused, and unanalyzed.

**As a result:**
* 🚨 **Authorities react** to problems instead of actively preventing them.
* 🔁 **Recurring issues** go unnoticed in the noise.
* 📉 **Resources are poorly allocated**, leading to inefficiency.
* 💔 **Public trust** gradually declines.

---

## 🚀 The Solution — Oracle

**Oracle** transforms raw grievance data into actionable, real-time insights. 
Instead of just storing complaints as dead text, our system analyzes patterns to empower municipalities to:

* 🎯 **Identify** recurring issues before they escalate.
* 🗺️ **Detect** problem hotspots across city zones.
* 📈 **Track** trends and resolution times over time.
* 🧠 **Make** proactive, data-driven decisions.

---

## 🛠 Tech Stack

| Layer | Technology |
| --- | --- |
| **Frontend** | ⚛️ React |
| **Backend** | ⚡ FastAPI (Python) |
| **Data Processing** | 🐼 Pandas, 🔢 NumPy |
| **Database** | 🍃 MongoDB |

---

## ⚙️ How It Works

1. 📥 **Data Collection:** Automatically collects citizen complaints across categories like water, sanitation, and infrastructure.
2. 🧹 **Data Processing:** Cleans, standardizes, and structures the raw data pipelines using Pandas and NumPy.
3. 🔍 **Insight Generation:** Processes the data to identify the top issues, highly affected areas, and time-based trends.
4. 🔌 **API Layer:** A blazing-fast FastAPI server securely serves these insights through structured REST endpoints.
5. 📊 **Visualization:** An intuitive React dashboard visualizes the insights, allowing decision-makers to act swiftly.

---

## 💡 Tagline

> *"A smart city isn't built on sensors and concrete alone; it is built by listening to the voices of its people—and having the wisdom to act."*

## 🔐 UX Enhancement — Show Password Option

To improve usability and reduce login friction, Argus includes a “Show Password” toggle in authentication forms.

✨ Why It Matters
👁️ Improves accuracy by letting users verify their input
🔐 Reduces login failures caused by mistyped passwords
⚡ Enhances user experience without compromising security
⚙️ How It Works
A simple toggle (eye icon 👁️) is provided inside the password field
When enabled, the password becomes visible in plain text
When disabled, it reverts to masked (••••••••) format
## 🛡️ Security Considerations
Password is only visible on the user’s screen
Automatically re-masks when the field loses focus (optional enhancement)
Works entirely on the client-side—no sensitive data exposure
