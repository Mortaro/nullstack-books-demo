import Nullstack from 'nullstack';

import Authentication from './Authentication';
import Book from './Book';
import Books from './Books';

class Application extends Nullstack {

  static async initiate(context) {
    const database = {host: 'mongodb://localhost:27017/', name: 'nullstack-books-demo'}
    const {MongoClient} = await import('mongodb');
    const {default: session} = await import('express-session');
    const {default: mongoSession} = await import('connect-mongodb-session');
    const databaseClient = new MongoClient(database.host+database.name);
    await databaseClient.connect();
    context.database = await databaseClient.db(database.name);
    const MongoDBStore = mongoSession(session);
    const store = new MongoDBStore({
      uri: database.host+database.name,
      databaseName: database.name,
      collection: 'sessions'
    });
    context.server.use(session({
      secret: 'secret',
      resave: true,
      saveUninitialized: true,
      store: store,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
      },
    }));
    context.port = 5000;
  }

  static async findUserBySession({database, request}) {
    if(!request.session.user) return null;
    const user = await database.collection('users').findOne({email: request.session.user});
    if(!user) return null;
    delete user.encryptedPassword;
    return user;
  }

  async initiate(context) {
    context.user = context.user || await this.findUserBySession();
  }

  static async clearSession({request}) {
    request.session.user = null;
  }

  async logout(context) {
    await this.clearSession();
    context.user = null;
  }

  renderMenu({user}) {
    return (
      <header class="flex w-100 bg-blue-600 mb-4 md:mb-12 shadow">
        <div class="container mx-auto">
          <nav>
            <a class="inline-block text-white py-4 px-2" href="/"> Books List </a>
            {!user && <a class="inline-block text-white py-4 px-2" href="/login"> Login </a>}
            {user && <a class="inline-block text-white py-4 px-2" href="/book"> Add Book </a>}
            {user && <a class="inline-block text-white py-4 px-2" href="#" onclick={this.logout}> Logout </a>}
          </nav>
        </div>
      </header>
    )
  }

  render({user}) {
    return (
      <main>
        <Menu />
        <Books route="/" />
        {user && <Book route="/book" />}
        {user && <Book route="/book/:id" />}
        {!user && <Authentication route="*" />}
      </main>
    )
  }

}

export default Application;