# Paint Tin Damage Prediction API

FastAPI backend service for ML-powered damage prediction system.

## Features

- 🎯 **Damage Rate Prediction** - XGBoost model with 85%+ accuracy
- 📊 **Analytics Dashboard** - Real-time insights and trends
- 🚨 **Risk Assessment** - Categorize shipments by risk level
- 💡 **Smart Recommendations** - Actionable suggestions to reduce damage
- 📈 **Pareto Analysis** - Identify vital few factors causing most damage
- 🔐 **Secure Authentication** - JWT-based user management

## Quick Start

### Prerequisites

- Python 3.10+
- MongoDB 6.0+
- Trained ML models (from notebooks)

### Installation

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Edit .env with your settings (especially SECRET_KEY!)
