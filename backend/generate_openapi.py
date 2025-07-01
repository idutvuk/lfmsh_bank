#!/usr/bin/env python3
"""
Script to generate OpenAPI specification for the LFMSH Bank API
"""

import json
import sys
from pathlib import Path

# Add the app directory to the Python path
sys.path.insert(0, str(Path(__file__).parent / "app"))

from fastapi.openapi.utils import get_openapi
from app.main import app


def generate_openapi_spec():
    """Generate OpenAPI specification for the FastAPI app"""
    
    # Get the OpenAPI schema
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    
    # Add additional OpenAPI metadata
    openapi_schema["info"]["contact"] = {
        "name": "LFMSH Team",
        "email": "example@example.com"
    }
    
    openapi_schema["info"]["license"] = {
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT"
    }
    
    # Add servers configuration
    openapi_schema["servers"] = [
        {
            "url": "http://localhost:8000",
            "description": "Development server"
        },
        {
            "url": "https://api.lfmsh-bank.com",
            "description": "Production server"
        }
    ]
    
    # Add security schemes
    openapi_schema["components"]["securitySchemes"] = {
        "bearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "JWT token obtained from /api/v1/auth/jwt/create/"
        }
    }
    
    # Add global security requirement
    openapi_schema["security"] = [
        {
            "bearerAuth": []
        }
    ]
    
    return openapi_schema


def save_openapi_spec(spec, output_file="openapi.json"):
    """Save OpenAPI specification to a file"""
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(spec, f, indent=2, ensure_ascii=False)
    print(f"OpenAPI specification saved to {output_file}")


def save_openapi_yaml(spec, output_file="openapi.yaml"):
    """Save OpenAPI specification to YAML file"""
    try:
        import yaml
        with open(output_file, "w", encoding="utf-8") as f:
            yaml.dump(spec, f, default_flow_style=False, allow_unicode=True, sort_keys=False)
        print(f"OpenAPI specification saved to {output_file}")
    except ImportError:
        print("PyYAML not installed. Skipping YAML generation.")
        print("Install with: pip install pyyaml")


if __name__ == "__main__":
    print("Generating OpenAPI specification for LFMSH Bank API...")
    
    try:
        # Generate the specification
        spec = generate_openapi_spec()
        
        # Save as JSON
        save_openapi_spec(spec, "openapi.json")
        
        # Save as YAML
        save_openapi_yaml(spec, "openapi.yaml")
        
        print("OpenAPI specification generation completed successfully!")
        
        # Print some basic stats
        paths = spec.get("paths", {})
        print(f"Total endpoints: {len(paths)}")
        
        # Count endpoints by method
        methods = {}
        for path, path_item in paths.items():
            for method in ["get", "post", "put", "delete", "patch"]:
                if method in path_item:
                    methods[method.upper()] = methods.get(method.upper(), 0) + 1
        
        print("Endpoints by method:")
        for method, count in sorted(methods.items()):
            print(f"  {method}: {count}")
            
    except Exception as e:
        print(f"Error generating OpenAPI specification: {e}")
        sys.exit(1) 