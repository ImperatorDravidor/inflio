Introduction
Klap API
Get ready-to-publish short-form videos from long videos using AI programmatically.

Overview
Klap is a service that allows users to input long videos and our AI will extract the most interesting moments and edit them into viral shorts for social media (with dynamic captions, AI reframing, etc.). Users can also upload already short videos and just use the AI editing features (add captions and reframe).

Documentation Structure
Our documentation is organized into two main sections:

Use Cases: Learn how to use the Klap API for specific scenarios

Generate Shorts: Extract viral shorts from long videos
Caption/Reframe Video: Add captions and/or reframe videos
Endpoints: Detailed technical reference for each API endpoint

Tasks: Create and monitor processing tasks
Projects: Manage generated videos and shorts
Exports: Export your videos in final format
Getting Started
API Key: To use the Klap API, you need an API key which can be obtained in your Klap account https://klap.app/rest-api
Base URL: The API requests should be made to https://api.klap.app/v2.
Making Requests
The API uses standard HTTP methods: GET and POST.
Requests must include the API key in the header: Authorization: Bearer <your_api_key>.
JSON format is used for both requests and responses.
Object Formats
For details about the data structures returned by the API, see the Object Formats page.