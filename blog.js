
const request = require('request');
const xml2js = require('xml2js');
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
var i = 25;

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
    'login': {
        'type': Sequelize.STRING,
        'allowNull': false,
        'unique': true
    },
    'name': {
        'type': Sequelize.STRING,
        'allowNull': false
    },
    'credentials': {
        'type': Sequelize.STRING,
        'allowNull': false
    }
});
const Id = database.define('id', {
    'id1': {
        'type': Sequelize.INTEGER
    }
});
const Entry = database.define('entry', {
    'PhoneNumber': {
        'type': Sequelize.STRING,
        'allowNull': false
    },
    'Title': {
        'type': Sequelize.STRING,
        'allowNull': false
    },
    'Content': {
        'type': Sequelize.STRING,
        'allowNull': false
    },
    'Photo': {
        'type': Sequelize.STRING,
        'allowNull': true
    },
    'Location': {
        'type': Sequelize.STRING,
        'allowNull': true
    },
    'Organ': {
        'type': Sequelize.STRING,
        'allowNull': true
    }
    
});

const Comment = database.define('comment', {
    'content': {
        'type': Sequelize.STRING,
        'allowNull': false
    }
});
Entry.hasMany(Comment);
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


server.get(['/', '/main'], (request, response) => {
    response.render('main', {
        'entries': null
    });
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
    console.log(login + "  " + password);

    // if (request.session.errors.length > 0) {
    //     response.redirect(destination);

    //     return;
    // }

    User.findOne({ 'where': { 'login': login } }).then(user => {
        if (password != user.credentials) {
            console.log(user);

            request.session.errors.push('The login or password is not valid.')
            response.redirect(destination);
            return;
        }

        request.session.userID = user.id;
        request.session.authorized = true;
        Entry.findAll({ 'where': { 'Organ': login } }
            ).then(entries => {
            response.render('entries', {
                'session': request.session,
                'entries': entries
            });
        }).catch(error => {
            console.error(error);
            response.status(500).end('Internal Server Error');
        });
         
    }).catch(error => {
        console.error(error);
        request.session.errors.push('Failed to authenticate.')
        response.redirect(destination);
        return;
    })
});
// server.get('/organEntries', (request, response) => {
//     Entry.findById(request.session.userID).then(entry => {
//         Entry.findAll({ 'where': { 'Organ': entry.Organ }}
//             ).then(entries => {
//             response.render('entries', {
//                 'session': request.session,
//                 'entries': entries
//             });
//         }).catch(error => {
//             console.error(error);
//             response.status(500).end('Internal Server Error');
//         });
//     }).catch(error => {
//         console.error(error);
//         request.session.errors.push('Failed to find the specified blog entry.')
//         response.redirect(previousLocation);
//     });
// });
server.get('/entries', (request, response) => {
    Entry.findAll({ order: [['createdAt', 'DESC']]}
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

server.get('/entry/create', (request, response) => {
   
   // const previousLocation = request.header('Referer') || '/entries';
     const organ = request.query['organ'];
     console.log(organ);

    let entry = undefined;
    response.render('entry-create-update', {
        'session': request.session,
        'entry': null,
        'comment': null,
        'organ': organ
    });
    // } else {
    //     id = request.params['id'];
    //     if (!id) {
    //         request.session.errors.push('The blog entry is unknown.');
    //         response.redirect(previousLocation);
    //         return;
    //     }
    //     Entry.findById(id).then(entry => {
    //         response.render('entry-create-update', {
    //             'entry': entry,
    //             'comment': null
    //         });
    //     }).catch(error => {
    //         console.error(error);
    //         request.session.errors.push('Failed to find the specified blog entry.')
    //         response.redirect(previousLocation);
    //     });
    // }
});

server.post('/entry/create', (request, response) => {
   
    const destination = request.header('Referer') || '/entries';

    // let id = undefined;
    // if (!request.path.endsWith('/create')) {
    //     id = request.params['id'];
    //     if (!id) {
    //         request.session.errors.push('The blog entry is unknown.');
    //         response.redirect(destination);

    //         return;
    //     }
    // }
    const PhoneNumber = request.body['phoneNumber'];
    const Title = request.body['title'];
    const Photo = request.body['photo'];
    const Content = request.body['content'];
    const Location = request.body['location'];    
    const ProblemRegion = request.body['problemRegion'];
    const Organ = request.body['organ'];
    console.log(Organ + " muhanmed");

    // if (id) {
    //     Entry.update({
    //         'title': title,
    //         'content': content
    //     }, {
    //         'where': {
    //             'id': id
    //         }
    //     }).then(result => {
    //         response.redirect(`/entry/${id}`);
    //     }).catch(error => {
    //         console.error(error);
    //         request.session.errors.push('Failed to update a new blog entry.');
    //         response.redirect(`/entry/${id}`);
    //     });
    // } else {
    Entry.create({
        'PhoneNumber': PhoneNumber,
        'Title': Title,
        'Content': Content,
        'Photo': Photo,
        'Location': Location,
        'ProblemRegion': ProblemRegion,
        'Organ': Organ

    }).then(entry => {
        //send_mail(PhoneNumber);

        send_xml(PhoneNumber, response).then(
            (data) => {
                console.log(data);
                response.redirect('/entries');
            }
        ).catch(
            (err) => {
                console.log(err);
                response.redirect('/entries');
            }
        );    
    }).catch(error => {
        console.error(error);
        request.session.errors.push('Failed to create a new blog entry.');
        response.redirect(destination);
    });
    //}
});

// server.post('/entry/:id/delete', (request, response) => {
//     // if (!request.session.authorized) {
//     //     response.status(401).end('Unauthorized');

//     //     return;
//     // }

//     // if (!request.session.administrator) {
//     //     response.status(403).end('Forbidden');

//     //     return;
//     // }
//     const previousLocation = request.header('Referer') || '/entries';

//     const id = request.params['id'];
//     if (!id) {
//         request.session.errors.push('The blog entry is unknown.');
//         response.redirect(previousLocation);
//         return;
//     }

//     Entry.destroy({
//         'where': {
//             'id': id
//         }
//     }).then(() => {
//         response.redirect('/entries');
//     }).catch(error => {
//         console.error(error);
//         request.session.errors.push('Failed to remove the blog entry.');
//         response.redirect('/entries');
//     });
// });

server.get('/entry/:id', (request, response) => {
    const previousLocation = request.header('Referer') || '/entries';

    const id = request.params['id'];
    if (!id) {
        request.session.errors.push('The blog entry is unknown.');
        response.redirect(previousLocation);

        return;
    }

    Entry.findById(id, {
        'include': [ {
            'model': Comment
        } ]
    }).then(entry => {
        response.render('entry', {
            'session': request.session,
            'entry': entry,
            'comment': null
        });
    }).catch(error => {
        console.error(error);

        request.session.errors.push('The blog entry was not found.');
        response.redirect(previousLocation);
    });
});

// server.get([
//     '/entry/:entryID/comment/:id/delete',
//     '/entry/:entryID/comment/:id/update'
// ]
// , (request, response) => {
//     const previousLocation = request.header('Referer') || '/entries';

//     const destination = request.header('Referer') || '/entries';

//     id = request.params['id'];


//     const userID = request.session['userID'];
//     if (!userID) {
//         request.session.errors.push("The comment's owner is unknown.");
//         response.redirect(destination);

//         return;
//     }
//     const entryID = request.params['entryID'];
//     if (!entryID) {
//         request.session.errors.push('The owning blog entry is not specified.');
//         response.redirect(destination);

//         return;
//     }

//     if (request.path.endsWith('/delete')) {

//         Comment.destroy({
//                 'where': {
//                     'id': id
//                 }
//             }).then(() => {
//                 response.redirect(`/entry/${entryID}`);
                

//             }).catch(error => {
//                 console.error(error);
//                 request.session.errors.push('Failed to remove the blog entry.');
//                 response.redirect(`/entry/${entryID}`);
                
//             });
//     } else {

//         Entry.findById(entryID).then(entry => {
//             Comment.findById(id).then(comment => {
//                 response.render('entry-create-update', {
//                     'entry': entry,
//                     'session': request.session,
//                     'comment': comment,
//                     'userId': request.session.userID,
//                     'admin': request.session.administrator
//                 });
//             }).catch(error => {
//                 console.error(error);
//                 request.session.errors.push('Failed to find the specified comment.')
//                 response.redirect(previousLocation);
//             });
//         }).catch(error => {
//             console.error(error);
//             request.session.errors.push('The blog entry was not found.');
//             response.redirect(previousLocation);
//         });
       
//     }

// });

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

            request.session.errors.push('Failed to create a new comment.');
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
}).then(() => {
    server.listen(serverPort, () => {
        console.log(`The server is listening on port '${serverPort}'.`);
    });
});


var send_xml = function(phone, res) {
    return new Promise((reject, resolve) => {
        var i = 0;
        Id.findById(1).then(id => {
            console.log(id);
            let options = { 
                 method: 'POST',
                 url: 'https://smspro.nikita.kg/api/message',
                 headers: { 'content-type': 'application/xml' },
                 body: '<?xml version="1.0" encoding="UTF-8"?> \n' +
                   '<message>\n\t' +
                     '<login>' + 'Pascal' + '</login>\n\t' +
                     '<pwd>' + 'uV5x3ent' + '</pwd>\n\t' +
                     '<id>' + id.id1 + '</id>\n\t' +
                     '<sender>' + '996773773827' + '</sender>\n\t' +
                     '<text>'+ 'Ваша жалоба принята во внимание!' +'</text>\n\t' +
                     '<phones>\n\t\t' +
                       '<phone>'+ phone +'</phone>\n\t' +
                     '</phones>\n\t' +
                   '</message>'
            };
            Id.update({
                'id1': id.id1 + 1
            }, {
                'where': {
                    'ID': 1
                }
            }).then(() => {
            }).catch(error => {
                console.error(error);
            });
                    //console.log(options);
            request(options, (error, response, body) => {
                console.log('----------request----------');
           // console.log(response);
        //    console.log(body);
                console.log(error);
                if (error) {     
                    console.log('----------error----------');
                    reject(error);
                }
                resolve(body);
            });        
        }).catch(error => {
             console.error(error);
    });
            
    });
}

var send_mail = function(email) {
    var api_key = 'key-d67441ff9bac5b07a5f83be55cfcd897';
    var domain = 'www.interier.kg';
    var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});
    
    var data = {
        from: 'Uberi.KG <postmaster@interier.kg>',
        to: email,
        subject: 'Uberi.KG',
        text: 'Ваша предложение отослано соответствующему органу исполнительной власти. '
    };

    mailgun.messages().send(data, function (error, body) {
        if(error) {
            throw error;
        }
    });
}