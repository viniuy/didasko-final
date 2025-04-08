<h1>Welcome to Didasko!</h1>

<h2>Initialization (Step by Step)</h2>

1. install dependencies
  > npm install > bash

2. Set up env. variables
  > ![image](https://github.com/user-attachments/assets/5e5daf1d-2c73-4a5d-b19a-809b512fb7b1)

3. Setup Database
  > npx prisma generate
  > npx prisma migrate dev
  > pnx prisma db push

4. Create intial users
  > npx ts-node prisma/add-user.ts

5. Start the development server
 > npm run dev
