const path =
    require('path');

const express =
    require('express');
const bodyParser =
    require('body-parser');
const session =
    require('express-session')
const Sequelize =
    require('sequelize');
const bcrypt =
    require('bcryptjs');
const dotenv =
    require('dotenv').config();

let databaseHost =
    process.env['BLOG_DATABASE_HOST'];
let databasePort =
    process.env['BLOG_DATABASE_PORT'];
let databaseDialect =
    process.env['BLOG_DATABASE_DIALECT'];
let databaseName =
    process.env['BLOG_DATABASE_NAME'];
let databaseUser =
    process.env['BLOG_DATABASE_USER'];
let databasePassword =
    process.env['BLOG_DATABASE_PASSWORD'];
let serverPort = process.env['BLOG_SERVER_PORT'];
const sessionSecret = process.env['BLOG_SESSION_SECRET'];
const bcryptSaltLength =
    parseFloat(process.env['BLOG_BCRYPT_SALT_LENGTH'] || '8');
const adminPassword = process.env['BLOG_ADMIN_PASSWORD'];
const userPassword = process.env['BLOG_USER_PASSWORD'];

const database = new Sequelize(databaseName, databaseUser, databasePassword, {
    'host': databaseHost,
    'port': databasePort,
    'dialect': databaseDialect,
    'dialectOptions': {
        'charset': 'utf8'
    }
});

const User = database.define('user', {
    'firstname': {
        'type': Sequelize.STRING,
        'allowNull': false,
    },
    'lastname': {
        'type': Sequelize.STRING,
        'allowNull': false,
    },
    'login': {
        'type': Sequelize.STRING,
        'allowNull': false,
        'unique': true
    },
    'credentials': {
        'type': Sequelize.STRING,
        'allowNull': false
    },
    'administrator': {
        'type': Sequelize.BOOLEAN,
        'allowNull': false,
        'defaultValue': false
    },
    'email': {
        'type': Sequelize.STRING,
        'allowNull': false
    }

});

const Entry = database.define('entry', {
    'title': {
        'type': Sequelize.STRING,
        'allowNull': false
    },
    'content': {
        'type': Sequelize.STRING,
        'allowNull': false
    }
});

const Comment = database.define('comment', {
    'content': {
        'type': Sequelize.STRING,
        'allowNull': false
    }
});

User.hasMany(Comment);
Entry.hasMany(Comment);
Comment.belongsTo(User);
Comment.belongsTo(Entry);

const server = express();
server.set('view engine', 'ejs');
const user_id = 1;
server.use(express.static(path.join(__dirname, 'static')));
server.use(bodyParser.urlencoded({ 'extended': true }));
server.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: true
}));

server.use((request, response, next) => {
    if (!request.session.errors) {
        request.session.errors = [];
    }

    next();
});

server.get('/login', (request, response) => {
    response.render('login', {
        'session': request.session
    });
});

server.post('/login', (request, response) => {
    const destination = '/';

    const login = request.body['login'];
    if (!login) {
        request.session.errors.push('The login was not provided.')
    }

    const password = request.body['password'];
    if (!password) {
        request.session.errors.push('The password was not provided.')
    }

    if (request.session.errors.length > 0) {
        response.redirect(destination);

        return;
    }

    User.findOne({ 'where': { 'login': login } }).then(user => {
        if (!bcrypt.compareSync(password, user.credentials)) {
            request.session.errors.push('The login or password is not valid.')
            response.redirect(destination);

            return;
        }

        request.session.userID = user.id;
        request.session.authorized = true;
        request.session.administrator = user.administrator;
        response.redirect(destination);
    }).catch(error => {
        console.error(error);

        request.session.errors.push('Incorrect username or password')
        response.redirect(destination);

        return;
    })
});

server.post('/registrate', (request, response) => {
    const destination = '/';

    const firstname = request.body['firstname'];
    const lastname = request.body['lastname'];
    const login = request.body['login'];
    const password = request.body['password'];
    const email = request.body['email'];
    
  

    const credentials =
         bcrypt.hashSync(password, bcryptSaltLength);
    User.create({
        'firstname': firstname,
        'lastname': lastname,
        'login': login,
        'credentials': credentials,
        'email': email
    }).then(user => {
        request.session.userID = user.id;
        request.session.authorized = true;
        request.session.administrator = user.administrator;
        response.redirect(destination);
    }).catch(error => {
        console.error(error);
        request.session.errors.push('User already exists');
        response.redirect(destination);
    });
    return;
});

server.post('/logout', (request, response) => {
    request.session.regenerate(() => {
        response.redirect('/');
    });
});

server.get(['/', '/entries'], (request, response) => {
    Entry.findAll({order: '"updatedAt" DESC' }
        ).then(entries => {
        response.render('entries', {
            'session': request.session,
            'entries': entries
        });
    }).catch(error => {
        console.error(error);
        response.status(500).end('Internal Server Error');
    });
});

server.get(['/entry/create', '/entry/:id/update'], (request, response) => {
    if (!request.session.authorized) {
        response.status(401).end('Unauthorized');
        return;
    }

    if (!request.session.administrator) {
        response.status(403).end('Forbidden');
        return;
    }

    const previousLocation = request.header('Referer') || '/entries';

    let entry = undefined;
    if (request.path === '/entry/create') {
        response.render('entry-create-update', {
            'session': request.session,
            'entry': null,
            'comment': null
        });
    } else {
        id = request.params['id'];
        if (!id) {
            request.session.errors.push('The blog entry is unknown.');
            response.redirect(previousLocation);

            return;
        }

        Entry.findById(id).then(entry => {
            response.render('entry-create-update', {
                'session': request.session,
                'entry': entry,
                'comment': null
            });
        }).catch(error => {
            console.error(error);

            request.session.errors.push('Failed to find the specified blog entry.')
            response.redirect(previousLocation);
        });
    }
});

server.post(['/entry/create', '/entry/:id/update'], (request, response) => {
    if (!request.session.authorized) {
        response.status(401).end('Unauthorized');
        return;
    }

    if (!request.session.administrator) {
        response.status(403).end('Forbidden');
        return;
    }
    const destination = request.header('Referer') || '/entries';

    let id = undefined;
    if (!request.path.endsWith('/create')) {
        id = request.params['id'];
        if (!id) {
            request.session.errors.push('The blog entry is unknown.');
            response.redirect(destination);

            return;
        }
    }

    const title = request.body['title'];
    if (!title) {
        request.session.errors.push('The entry title must be specified.');
    }

    const content = request.body['content'];
    if (!content) {
        request.session.errors.push('The entry content must be specified.');
    }

    if (request.session.errors.length > 0) {
        response.redirect(destination);
        return;
    }

    if (id) {
        Entry.update({
            'title': title,
            'content': content
        }, {
            'where': {
                'id': id
            }
        }).then(result => {
            response.redirect(`/entry/${id}`);
        }).catch(error => {
            console.error(error);
            request.session.errors.push('Failed to update a new blog entry.');
            response.redirect(`/entry/${id}`);
        });
    } else {
        Entry.create({
            'title': title,
            'content': content
        }).then(entry => {
            response.redirect(`/entry/${entry.id}`);
        }).catch(error => {
            console.error(error);
            request.session.errors.push('Failed to create a new blog entry.');
            response.redirect(destination);
        });
    }
});

server.post('/entry/:id/delete', (request, response) => {
    if (!request.session.authorized) {
        response.status(401).end('Unauthorized');

        return;
    }

    if (!request.session.administrator) {
        response.status(403).end('Forbidden');

        return;
    }
    const previousLocation = request.header('Referer') || '/entries';

    const id = request.params['id'];
    if (!id) {
        request.session.errors.push('The blog entry is unknown.');
        response.redirect(previousLocation);
        return;
    }

    Entry.destroy({
        'where': {
            'id': id
        }
    }).then(() => {
        response.redirect('/entries');
    }).catch(error => {
        console.error(error);
        request.session.errors.push('Failed to remove the blog entry.');
        response.redirect('/entries');
    });
});

server.get('/entry/:id', (request, response) => {
    const previousLocation = request.header('Referer') || '/entries';

    const id = request.params['id'];
    if (!id) {
        request.session.errors.push('The blog entry is unknown.');
        response.redirect(previousLocation);
        return;
    }
    Entry.findById(id,  {
        'include': [ {
            'model': Comment,
            'include': [ User ]
        }
        ],
    }).then(entry => {
        response.render('entry', {
            'session': request.session,
            'entry': entry,
            'comment': null,
            'userId': request.session.userID,
            'admin': request.session.administrator
        });
    }).catch(error => {
        console.error(error);
        request.session.errors.push('The blog entry was not found.');
        response.redirect(previousLocation);
    });
});

server.get([
    '/entry/:entryID/comment/:id/delete',
    '/entry/:entryID/comment/:id/update'
]
, (request, response) => {
    const previousLocation = request.header('Referer') || '/entries';

    if (!request.session.authorized) {
        response.status(401).end('Unauthorized');

        return;
    }
    const destination = request.header('Referer') || '/entries';

    id = request.params['id'];


    const userID = request.session['userID'];
    if (!userID) {
        request.session.errors.push("The comment's owner is unknown.");
        response.redirect(destination);

        return;
    }

    const entryID = request.params['entryID'];
    if (!entryID) {
        request.session.errors.push('The owning blog entry is not specified.');
        response.redirect(destination);

        return;
    }

    if (request.path.endsWith('/delete')) {

        Comment.destroy({
                'where': {
                    'id': id
                }
            }).then(() => {
                response.redirect(`/entry/${entryID}`);
                

            }).catch(error => {
                console.error(error);
                request.session.errors.push('Failed to remove the blog entry.');
                response.redirect(`/entry/${entryID}`);
                
            });
    } else {

        Entry.findById(entryID).then(entry => {
            Comment.findById(id).then(comment => {
                response.render('entry-create-update', {
                    'entry': entry,
                    'session': request.session,
                    'comment': comment,
                    'userId': request.session.userID,
                    'admin': request.session.administrator
                });
            }).catch(error => {
                console.error(error);
                request.session.errors.push('Failed to find the specified comment.')
                response.redirect(previousLocation);
            });
        }).catch(error => {
            console.error(error);
            request.session.errors.push('The blog entry was not found.');
            response.redirect(previousLocation);
        });
       
    }

});

server.post([
    '/entry/:entryID/comment/create',
    '/entry/:entryID/comment/:id/update'
], (request, response) => {
    if (!request.session.authorized) {
        response.status(401).end('Unauthorized');

        return;
    }

    const destination = request.header('Referer') || '/entries';

    let id = undefined;
    if (!request.path.endsWith('/create')) {
        id = request.params['id'];
        if (!id) {
            request.session.errors.push('The comment is unknown.');
            response.redirect(destination);

            return;
        }
    }

    const content = request.body['content'];
    if (!content) {
        request.session.errors.push('The comment must be specified.');
        response.redirect(destination);

        return;
    }

    const userID = request.session['userID'];
    if (!userID) {
        request.session.errors.push("The comment's owner is unknown.");
        response.redirect(destination);

        return;
    }

    const entryID = request.params['entryID'];
    if (!entryID) {
        request.session.errors.push('The owning blog entry is not specified.');
        response.redirect(destination);

        return;
    }

    if (id) {
        Comment.update({
            'userId': userID,
            'entryId': entryID,
            'content': content
        }, {
            'where': {
                'id': id
            }
        }).then(() => {
            response.redirect(`/entry/${entryID}`);
        }).catch(error => {
            console.error(error);

            request.session.errors.push('Failed to update a comment.');
            response.redirect(`/entry/${entryID}`);
        });
    } else {
        Comment.create({
            'userId': userID,
            'entryId': entryID,
            'content': content
        }).then(() => {
            response.redirect(`/entry/${entryID}`);
        }).catch(error => {
            console.error(error);

            request.session.errors.push('Failed to create a new comment.');
            response.redirect(`/entry/${entryID}`);
        });
    }
});

database.sync().then(() => {
    const credentials =
        bcrypt.hashSync(adminPassword, bcryptSaltLength);

    return User.upsert({
        'firstname': 'Mukhamed',
        'lastname': 'Khasanza',
        'login': 'administrator',
        'credentials': credentials,
        'administrator': true,
        'email': 'hasanza_1996_11@mail.ru'
    });
}).then(() => {
    server.listen(serverPort, () => {
        console.log(`The server is listening on port '${serverPort}'.`);
    });
});

