# Instructions to get your Supabase Service Role Key

To allow the application's server to securely save video files to your Supabase Storage, you need to provide it with a special "Service Role Key". This key should be kept secret and should only be used on the server.

## Steps:

1.  **Open your Supabase Dashboard**: Go to [https://app.supabase.com/](https://app.supabase.com/) and navigate to your project.

2.  **Go to API Settings**: In the left sidebar, click on the "Settings" icon (the cog wheel), and then select the "API" section.

3.  **Find Your Service Role Key**:
    *   Scroll down to the section named "Project API keys".
    *   You will see a key labeled `service_role` with the description "This key has the ability to bypass Row Level Security. Never share it publicly."
    *   Click "Copy" to copy this key to your clipboard.

    ![Supabase API Keys](https://supabase.com/docs/img/guides/api/api-keys.png)

4.  **Add the Key to Your Environment File**:
    *   Open the `.env.local` file in the root of your project.
    *   Add the following line to the file, pasting the key you just copied.

    ```bash
    SUPABASE_SERVICE_ROLE_KEY=your_copied_service_role_key_here
    ```

5.  **Restart Your Application**: For the changes to take effect, you must stop and restart your application server.

Once you have done this, the application will have the necessary permissions to download the clips from Klap and store them in your own platform. 