Endpoints
Projects
Project Endpoints
Project endpoints are used to manage and interact with generated shorts.

List Projects
List all projects (shorts) within a folder.

Endpoint: GET /projects/{folder_id}

Request
GET /v2/projects/{folder_id}
Authorization: Bearer <your-api-key>
Path Parameters
Parameter	Type	Description
folder_id	string	ID of the folder containing the projects
Response
Returns an array of Project Objects:

[
  {
    "id": "project_001",
    "author_id": "user_123",
    "folder_id": "folder_001",
    "name": "Short Clip 1",
    "created_at": "2023-10-01T12:05:00Z",
    "virality_score": 0.85,
    "virality_score_explanation": "High engagement predicted."
  },
  {
    "id": "project_002",
    "author_id": "user_123",
    "folder_id": "folder_001",
    "name": "Short Clip 2",
    "created_at": "2023-10-01T12:06:00Z",
    "virality_score": 0.75,
    "virality_score_explanation": "Moderate engagement predicted."
  }
]
Get Project
Get a specific project (short) by ID.

Endpoint: GET /projects/{folder_id}/{project_id}

Request
GET /v2/projects/{folder_id}/{project_id}
Authorization: Bearer <your-api-key>
Path Parameters
Parameter	Type	Description
folder_id	string	ID of the folder containing the project
project_id	string	ID of the project to retrieve
Response
Returns a Project Object:

{
  "id": "project_001",
  "author_id": "user_123",
  "folder_id": "folder_001",
  "name": "Short Clip 1",
  "created_at": "2023-10-01T12:05:00Z",
  "virality_score": 0.85,
  "virality_score_explanation": "High engagement predicted."
}
Get Project Direct
Get a specific project by ID (without folder).

Endpoint: GET /projects/{project_id}

Request
GET /v2/projects/{project_id}
Authorization: Bearer <your-api-key>
Path Parameters
Parameter	Type	Description
project_id	string	ID of the project to retrieve
Response
Returns a Project Object:

{
  "id": "project_001",
  "author_id": "user_123",
  "folder_id": null,
  "name": "Edited Video",
  "created_at": "2023-10-01T12:05:00Z",
  "virality_score": null,
  "virality_score_explanation": null
}
Preview/Embed a Project
To preview or embed a project in your application, use the following URL format:

https://klap.app/player/{project_id}
This URL can be used in an iframe or as a direct link to preview a project.

Last updated on April 23, 2025
Tasks
