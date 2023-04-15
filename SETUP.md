# Setting up your development environment

## Install prerequisites
- PostgreSQL 14.0 or higher
- Node.js 18.15.0 or higher
- Nginx (or any other web server)
- TypeScript 5.0.2 or higher
- PM2 (or any other process manager)

I suggest you to use Linux (Debian) to run this project.

If you're using Windows, you can use WSL2 or try to install all the prerequisites on Windows.

### Clone the repository

```bash
$ git clone https://github.com/RobotoSkunk/robotoskunk.com.git
$ cd robotoskunk.com
```

### Configure .env file

```bash
$ cp .env.example .env
$ nano .env
```

### URL rewriting

```nginx
location / {
	proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
	proxy_set_header Host $host;
	proxy_pass http://127.0.0.1:8080;
	proxy_http_version 1.1;
	proxy_set_header Upgrade $http_upgrade;
	proxy_set_header Connection "upgrade";
}
```

### Install dependencies and build

```bash
$ npm run setup
```

### Configure database

At the moment, there's no way to automatically configure the database. You have to do it manually.

```bash
$ psql -U postgres
```

Then create the database, create the user, connect to the new database,
copy and paste the content of `database.psql` file.

### Run the project

```bash
$ npm run debug
```

Or

```bash
$ nodemon
```
