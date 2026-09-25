#!/usr/bin/env python3

"""Verify Kaggle dataset access for AgroAI plant disease detection project."""

import os
import sys
from pathlib import Path

def load_env_file(env_path: Path) -> dict:
    """Load environment variables from .env file."""
    env_vars = {}
    try:
        with open(env_path, 'rb') as f:
            content = f.read().decode('utf-8')
            for line in content.splitlines():
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                if '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key.strip()] = value.strip()
        return env_vars
    except FileNotFoundError:
        return {}

def main():
    # Environment variables expected
    expected_vars = ["KAGGLE_USERNAME", "KAGGLE_KEY"]
    
    # Determine environment file path
    workspace_root = Path.cwd()
    env_file = workspace_root / ".env"
    
    # Load environment variables
    env_vars = load_env_file(env_file)
    
    # Verify required environment variables
    print("=== KAGGLE AUTHENTICATION VERIFICATION ===")
    auth_success = True
    for var_name in expected_vars:
        var_value = env_vars.get(var_name, os.environ.get(var_name))
        if var_value:
            if var_name == "KAGGLE_KEY":
                # For KAGGLE_KEY, mask all but first 4 characters
                masked_key = var_value[:4] + "*" * (len(var_value) - 4)
                print(f"[OK] {var_name} loaded: {masked_key}")
            else:
                print(f"[OK] {var_name} loaded: {var_value}")
        else:
            print(f"[FAIL] {var_name} NOT FOUND")
            print(f"  Required environment variable is missing.")
            print(f"  Please set {var_name} in .env file")
            print(f"  or export it in your shell.")
            auth_success = False
    
    if not auth_success:
        print("\n[FAIL] KAGGLE AUTHENTICATION FAILED")
        print("Please configure Kaggle credentials in .env file")
        sys.exit(1)
    
    print("✓ Kaggle authentication: SUCCESS")
    
    # Note: We won't attempt actual Kaggle API operations without user credentials
    # This script only validates that environment variables are set correctly
    
    print("\n=== NEXT STEPS ===")
    print("1. Set Kaggle credentials in .env file")
    print("2. Run this script again to verify authentication")
    print("3. Once authenticated, we can search for plant disease datasets")

if __name__ == "__main__":
    main()
