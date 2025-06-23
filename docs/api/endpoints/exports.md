Endpoints
Exports
Export Endpoints
Export endpoints are used to create export tasks and check their status.

Create Export
Create an export task for a project (short) within a folder.

Endpoint: POST /projects/{folder_id}/{project_id}/exports

Request
POST /v2/projects/{folder_id}/{project_id}/exports
Authorization: Bearer <your-api-key>
Content-Type: application/json
 
{
  "watermark": {
    "src_url": "https://example.com/logo.png",
    "pos_x": 0.5,
    "pos_y": 0.5,
    "scale": 1
  }
}
Path Parameters
Parameter	Type	Description
folder_id	string	ID of the folder containing the project
project_id	string	ID of the project to export
Request Body Parameters
Parameter	Type	Required	Description
watermark	object	No	Watermark configuration for the exported video
Watermark Object
Parameter	Type	Required	Description
src_url	string	Yes	URL of the watermark image
pos_x	number	No	Horizontal position (0-1, default: 0.5)
pos_y	number	No	Vertical position (0-1, default: 0.5)
scale	number	No	Size scale factor (default: 1)
Response
Returns an Export Object:

{
  "id": "export_001",
  "status": "processing",
  "src_url": null,
  "project_id": "project_001",
  "created_at": "2023-10-02T09:00:00Z",
  "finished_at": null,
  "name": "Exported Video",
  "author_id": "user_123",
  "folder_id": "folder_001",
  "descriptions": "Export started."
}
Create Export Direct
Create an export task for a project without a folder (used for video-to-video tasks).

Endpoint: POST /projects/{project_id}/exports

Request
POST /v2/projects/{project_id}/exports
Authorization: Bearer <your-api-key>
Content-Type: application/json
 
{
  "watermark": {
    "src_url": "https://example.com/logo.png",
    "pos_x": 0.5,
    "pos_y": 0.5,
    "scale": 1
  }
}
Path Parameters
Parameter	Type	Description
project_id	string	ID of the project to export
Request Body Parameters
The same as for the Create Export endpoint.

Response
Returns an Export Object:

{
  "id": "export_001",
  "status": "processing",
  "src_url": null,
  "project_id": "project_001",
  "created_at": "2023-10-02T09:00:00Z",
  "finished_at": null,
  "name": "Exported Video",
  "author_id": "user_123",
  "folder_id": null,
  "descriptions": "Export started."
}
Get Export Status
Get the status of an export task for a project within a folder.

Endpoint: GET /projects/{folder_id}/{project_id}/exports/{export_id}

Request
GET /v2/projects/{folder_id}/{project_id}/exports/{export_id}
Authorization: Bearer <your-api-key>
Path Parameters
Parameter	Type	Description
folder_id	string	ID of the folder containing the project
project_id	string	ID of the project
export_id	string	ID of the export task
Response
Returns an Export Object with the current status:

{
  "id": "export_001",
  "status": "ready",
  "src_url": "https://example.com/exports/export_001.mp4",
  "project_id": "project_001",
  "created_at": "2023-10-02T09:00:00Z",
  "finished_at": "2023-10-02T09:15:00Z",
  "name": "Exported Video",
  "author_id": "user_123",
  "folder_id": "folder_001",
  "descriptions": "Export completed successfully."
}
Get Export Status Direct
Get the status of an export task for a project without a folder.

Endpoint: GET /projects/{project_id}/exports/{export_id}

Request
GET /v2/projects/{project_id}/exports/{export_id}
Authorization: Bearer <your-api-key>
Path Parameters
Parameter	Type	Description
project_id	string	ID of the project
export_id	string	ID of the export task
Response
Returns an Export Object with the current status:

{
  "id": "export_001",
  "status": "ready",
  "src_url": "https://example.com/exports/export_001.mp4",
  "project_id": "project_001",
  "created_at": "2023-10-02T09:00:00Z",
  "finished_at": "2023-10-02T09:15:00Z",
  "name": "Exported Video",
  "author_id": "user_123",
  "folder_id": null,
  "descriptions": "Export completed successfully."
}
List All Exports
List all exports for a user, optionally filtered by folder or project.

Endpoint: GET /exports

Request
GET /v2/exports?folder_id=folder_001&project_id=project_001
Authorization: Bearer <your-api-key>
Query Parameters
Parameter	Type	Required	Description
folder_id	string	No	Filter by folder ID
project_id	string	No	Filter by project ID
Response
Returns an array of Export Objects:

[
  {
    "id": "export_001",
    "status": "ready",
    "src_url": "https://example.com/exports/export_001.mp4",
    "project_id": "project_001",
    "created_at": "2023-10-02T09:00:00Z",
    "finished_at": "2023-10-02T09:15:00Z",
    "name": "Exported Video",
    "author_id": "user_123",
    "folder_id": "folder_001",
    "descriptions": "Export completed successfully."
  }
]
Last updated on April 23, 2025