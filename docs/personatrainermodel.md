# Train Flux LoRAs For Portraits

> FLUX LoRA training optimized for portrait generation, with bright highlights, excellent prompt following and highly detailed results.


## Overview

- **Endpoint**: `https://fal.run/fal-ai/flux-lora-portrait-trainer`
- **Model ID**: `fal-ai/flux-lora-portrait-trainer`
- **Category**: training
- **Kind**: training
**Tags**: lora, personalization



## API Information

This model can be used via our HTTP API or more conveniently via our client libraries.
See the input and output schema below, as well as the usage examples.


### Input Schema

The API accepts the following input parameters:


- **`images_data_url`** (`string`, _required_):
  URL to zip archive with images of a consistent style. Try to use at least 10 images, although more is better.
  
  In addition to images the archive can contain text files with captions. Each text file should have the same name as the image file it corresponds to.
  
  The captions can include a special string `[trigger]`. If a trigger_word is specified, it will replace `[trigger]` in the captions.

- **`trigger_phrase`** (`string`, _optional_):
  Trigger phrase to be used in the captions. If None, a trigger word will not be used.
  If no captions are provide the trigger_work will be used instead of captions. If captions are provided, the trigger word will replace the `[trigger]` string in the captions.

- **`learning_rate`** (`float`, _optional_):
  Learning rate to use for training. Default value: `0.00009`
  - Default: `0.00009`
  - Range: `0.000001` to `0.001`
  - Examples: 0.0002

- **`steps`** (`integer`, _optional_):
  Number of steps to train the LoRA on. Default value: `2500`
  - Default: `2500`
  - Range: `1` to `10000`
  - Examples: 1000

- **`multiresolution_training`** (`boolean`, _optional_):
  If True, multiresolution training will be used. Default value: `true`
  - Default: `true`
  - Examples: true

- **`subject_crop`** (`boolean`, _optional_):
  If True, the subject will be cropped from the image. Default value: `true`
  - Default: `true`
  - Examples: true

- **`data_archive_format`** (`string`, _optional_):
  The format of the archive. If not specified, the format will be inferred from the URL.

- **`resume_from_checkpoint`** (`string`, _optional_):
  URL to a checkpoint to resume training from. Default value: `""`
  - Default: `""`

- **`create_masks`** (`boolean`, _optional_):
  If True, masks will be created for the subject.
  - Default: `false`
  - Examples: false



**Required Parameters Example**:

```json
{
  "images_data_url": ""
}
```

**Full Example**:

```json
{
  "images_data_url": "",
  "learning_rate": 0.0002,
  "steps": 1000,
  "multiresolution_training": true,
  "subject_crop": true,
  "create_masks": false
}
```


### Output Schema

The API returns the following output format:

- **`diffusers_lora_file`** (`File`, _required_):
  URL to the trained diffusers lora weights.

- **`config_file`** (`File`, _required_):
  URL to the training configuration file.



**Example Response**:

```json
{
  "diffusers_lora_file": {
    "url": "",
    "content_type": "image/png",
    "file_name": "z9RV14K95DvU.png",
    "file_size": 4404019
  },
  "config_file": {
    "url": "",
    "content_type": "image/png",
    "file_name": "z9RV14K95DvU.png",
    "file_size": 4404019
  }
}
```


## Usage Examples

### cURL

```bash
curl --request POST \
  --url https://fal.run/fal-ai/flux-lora-portrait-trainer \
  --header "Authorization: Key $FAL_KEY" \
  --header "Content-Type: application/json" \
  --data '{
     "images_data_url": ""
   }'
```

### Python

Ensure you have the Python client installed:

```bash
pip install fal-client
```

Then use the API client to make requests:

```python
import fal_client

def on_queue_update(update):
    if isinstance(update, fal_client.InProgress):
        for log in update.logs:
           print(log["message"])

result = fal_client.subscribe(
    "fal-ai/flux-lora-portrait-trainer",
    arguments={
        "images_data_url": ""
    },
    with_logs=True,
    on_queue_update=on_queue_update,
)
print(result)
```

### JavaScript

Ensure you have the JavaScript client installed:

```bash
npm install --save @fal-ai/client
```

Then use the API client to make requests:

```javascript
import { fal } from "@fal-ai/client";

const result = await fal.subscribe("fal-ai/flux-lora-portrait-trainer", {
  input: {
    images_data_url: ""
  },
  logs: true,
  onQueueUpdate: (update) => {
    if (update.status === "IN_PROGRESS") {
      update.logs.map((log) => log.message).forEach(console.log);
    }
  },
});
console.log(result.data);
console.log(result.requestId);
```


## Additional Resources

### Documentation

- [Model Playground](https://fal.ai/models/fal-ai/flux-lora-portrait-trainer)
- [API Documentation](https://fal.ai/models/fal-ai/flux-lora-portrait-trainer/api)
- [OpenAPI Schema](https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/flux-lora-portrait-trainer)

### fal.ai Platform

- [Platform Documentation](https://docs.fal.ai)
- [Python Client](https://docs.fal.ai/clients/python)
- [JavaScript Client](https://docs.fal.ai/clients/javascript)
