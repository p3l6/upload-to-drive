**A fork of [Jodebu/upload-to-drive](https://github.com/Jodebu/upload-to-drive).**

## Changes from fork:
- Accepts glob for input files
- Sends every file individually instead of zipping.

# Upload to Google Drive
This is a **GitHub action** to upload a file(s) to **Google Drive** using a Google Service Account.

## Setup
This section lists the requirements to make this action work and how to meet them.

### Google Service Account (GSA)
First of all you will need a **Google Service Account** for your project. Service accounts are just specific Google account types that are used by services instead of people.
To make one go to [*Service Accounts*](https://console.cloud.google.com/apis/credentials) in the *IAM and administration* section of the **Google Cloud Plattform** dashboard and create a new project or choose the one you are already using for your current shenanigans.
Click on create new service account and continue with the process. At the end you will get the option to generate a key, **we need this key so store it safely**. It's a json file whith the following structure:
```json
{
  "type": "",
  "project_id": "",
  "private_key_id": "",
  "private_key": "",
  "client_email": "",
  "client_id": "",
  "auth_uri": "",
  "token_uri": "",
  "auth_provider_x509_cert_url": "",
  "client_x509_cert_url": ""
}
```

### Share Drive folder with the GSA
Go to your **Google Drive** and find the folder you want your files to be uploaded to and share it with the GSA. You can find your service account email address in the `client_email` property of your GSA credentials.
While you are here, take a note of **the folder's ID**, the long set of characters after the last `/` in your address bar if you have the folder opened in your browser.

### Store credentials as GitHub secrets
This action needs your GSA credentials to properly authenticate with Google and we don't want anybody to take a peek at them, right? Go to the **Secrets** section of your repo and add a new secret for your credentials. As per GitHub's recommendation, we will store any complex data (like your fancy JSON credentials) as a base64 encoded string.
You can encode your `.json` file easily into a new `.txt` file using any bash terminal (just don't forget to change the placeholders with the real name of your credentials file and and the desired output):
```bash
$ base64 CREDENTIALS_FILENAME.json > ENCODED_CREDENTIALS_FILENAME.txt
```
The contents of the newly generated `.txt` file is what we have to procure as a value for our secret.

>![](https://via.placeholder.com/15/f03c15/000000?text=+) **IMPORTANT**: This action assumes that the credentials are stored as a base64 encoded string. If that's not the case, the action will **fail**.

## Inputs
This section lists all inputs this action can take.

### `credentials`
Required: **YES**
A base64 encoded string with your GSA credentials.

### `folder`
Required: **YES**
The ID of the Google Drive folder you want to upload to.
>I would suggest you store this as an environmental variable or a Github secret


### `target`
Required: **YES**
The glob pattern for the file(s) to upload.
>This glob should only match files, not folders.

## Outputs
This section lists all outputs this action produces.
A link to the Drive folder.

### `link`
A link to the Drive folder.

## Usage Examples
This section contains some useful examples.

### Simple usage file workflow example
This a very simple workflow example that checks out the repo and uploads all `*.md` files to a Google Drive folder every time there is a push to master.
```yaml
name: Store markdown in Drive
on:
  push: { branches: [master] }
jobs:
  buildAndTestForSomePlatforms:
    name: Upload markdown to drive
    runs-on: ubuntu-latest
    steps:
      # Checkout
      - name: Checkout repository
        uses: actions/checkout@v2
      # Upload to Drive
      - name: Upload README.md to Google Drive
        uses: p3l6/upload-to-drive@main
        with:
          target: "*.md"
          credentials: secrets.<YOUR_DRIVE_CREDENTIALS>
          folder: <YOUR_DRIVE_FOLDER_ID>
```
