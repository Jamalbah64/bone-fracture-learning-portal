# FrACT - A Bone Fracture Detection/Classification GUI for patients and radiologists

This is the repo for our capstone project: A learning portal based around bone fracture detection and classification. The bone we'll be using is 23r-M/2.1, better known as the metaphyseal, torus (buckle) fracture of the distal radius.  

Currently, our application uses a dummy model from huggingface.co. In order to use the model, do the following steps:
1. Make an account on huggingface.co
2. Navigate to your profile in the top right, and select 'access tokens'
3. Create a new token, giving it all permissions in the 'Inference' category
4. Copy the token value
5. Past the value in server/.env for the variable 'HF_API_KEY'

To start the application, run 'npm run dev' in the client/react-app directory, and 'node server.js' in the server directory

Create an account, and then login to enter the site.
Once in the site, click on the various tabs in the navbar to interact with the content.
