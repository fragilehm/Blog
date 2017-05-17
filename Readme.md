Blog
====

Blog is a simple blog web application.
E_HOST=the location of the database server (localhost by default)
BLOG_DATABASE_PORT=the database port (3306 by default)
BLOG_DATABASE_DIALECT=the dialect of the database management engine (mysql by default)
BLOG_DATABASE_NAME=the name of the database (blog by default)
BLOG_DATABASE_USER=the user of the database with write permissions (blog_user by default)
BLOG_DATABASE_
## Required Software

* _Node.js (7.10.0)_
* _MySQL (5.7.18)_

## Usage

Create an `.env` file with secrets and parameters for all the components.

```bash
# Database
BLOG_DATABASPASSWORD=his pasword (empty by default)
T=the port to use by the server (8080 by default)

# Session
BLOG_SESSION_SECRET=session secret to use with cookies

# Server
BLOG_SERVER_POR
# bcrypt
BLOG_BCRYPT_SALT_LENGTH=length of the random salt (8 by default)

# Default Users
BLOG_ADMIN_PASSWORD=administrator password
BLOG_USER_PASSWORD=test user password
```

Create the database and the database user with the password specified in the
previous step in `.env` file (you can use MySQL Workbench, other management
tools, or issue SQL queries manually from the `mysql` command).

Install dependencies, ensure the database system is running, and start the
server.

```bash
npm install # to install dependencies
npm start   # to start the server
```

You can also use a local testing database stored in the `development` directory.

Ensure that MySQL was installed, and the `mysqld` binary is in the `PATH`
environment variable.

## Credits

Khasanza Mukhamed Makhmudovich (<hasanza_1996_11@mail.ru>)

