# QueueSmart - A Smart Queue Management App

## Prerequisites
Make sure you have the following installed before getting started:

- Node.js (v18 or higher)
- MySQL (v8.0)
- MySQL Workbench (for database setup)
- Git



## A. Getting Started
**1a.) Clone the Repo:**
```
git clone https://github.com/YOUR_REPO_LINK_HERE
cd QueueSystem
```
**2a.) Set Up the Database**

- Open MySQL Workbench and connect to your local instance
- Go to Server → Data Import
- Select Import from Self-Contained File
- Browse to q_sys.sql in the project root
- Under Default Target Schema, type queuesys
- Click Start Import

## B. Setup the Backend Environment
**1b.) Open a Terminal with the backend folder as the root:**
```
cd hardcode-backend
```

2b.) Create a ```.env``` file in the harcode-backend folder. Add the following:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=queuesys
```
Then save.
> REMEMBER: Add your ```.env``` file to the ```.gitignore``` so your passwords are not pushed into the repo. You can do this in Github by right clicking your ```.env``` and selecting  "Ignore file (add to .gitignore)." Can also do it by adding this to your ```.gitignore``` file in ```.QueueSystem/```:
```
# in hardcode-backend/.gitignore
.env # <- Add Starting here
node_modules
coverage
```

**2c.) Install Dependencies**

Install Dependencies in both the front and back-end.
```
# Assuming you're still in the hardcode-backend folder as the root:
npm install
# Then go into the front=end:
cd front-end
npm install
```

## C. Running the Application

**1c.) Start the Backend**

Open a terminal and root it to the Backend. Then Start it:
```
cd hardcode-backend
npm run dev
```
Check to see if you see the message in the Output:
> QueueSmart backend running on http://localhost:5001

**Or whatever your port is*



Re-route to the Front-end and Start it.
```
cd front-end
npm run dev
```

Check to see if you see the message in the Output:
> QueueSmart backend running on http://localhost:5173/

**Or whatever your port is*

Open your browser and go to the localhost link in the Front-end Output.


## D. Login Credentials

| Role  | Email                    | Password  |
|-------|--------------------------|-----------|
| Admin | admin@queuesmart.com     | admin123  |
| User  | testuser@gmail.com       | test123   |
| User  | alice@gmail.com          | test123   |
| User  | bob@gmail.com            | test123   |
| User  | charlie@gmail.com        | test123   |
| User  | diana@gmail.com          | test123   |

---
## E. Features

**1e.) Sign Up/Create your Account**

- Select the "Sign Up" option in the landing page. Fill out your:
  - Name
  - Email
  - Password

This will save your login credentials in the Database, creating a User Profile.

> Admin Credentials must be given through the Database.

**2e.) Login**

- Login with your User Credentials to Access 
  - Refer to the Login Credentials Table above in Section D.

**3e.) User Portal Features:**
- Dashboard
- Join Queue
> Features the **Smart Feature: Smart Suggestions.** When Joining a Queue, a Smart Suggestion will show up using Real Time to generate a suggestion on Queues that are shorter.
- Queue Status
- History

**4e.) Admin Portal Features:**
- Dashboard (Can Open/Close current Queues)
- Services (Creates new Services and shows Existing Services)
- Queue (Removal and Serving next User)
- Reports (Check the Summary, Users, Services and History)
> An Export of the Report can be generated via CSV file through the "Export CSV" button on the Report tab.



---
 
## Troubleshooting
 
**"Could not reach the server"**
→ Make sure the backend terminal is running on port 5000
 
**"Invalid email or password"**
→ Make sure you ran the full `q_sys.sql` import including the dummy data
 
**"Server error" on login**
→ Check your `.env` file — the password or database name may be wrong
 
**MySQL won't connect**
→ Open MySQL Workbench and check that the server status shows Running. On Windows, search for `services.msc`, find MySQL80 and click Start.
 
**"Cannot find module"**
→ Run `npm install` in both `hardcode-backend/` and `front-end/`
