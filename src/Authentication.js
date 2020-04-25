import Nullstack from 'nullstack';

class Authentication extends Nullstack {

  email = '';
  name = '';
  password = '';

  user = null;
  step = 'email';

  errors = {}

  initialize({metadata}) {
    metadata.title = "Login";
  }

  static async findUserByEmail({database, email}) {
    const errors = {};
    const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(!regex.test(String(email).toLocaleLowerCase())) {
      errors.email = "Invalid Email";
      return {errors};
    }
    const user = await database.collection('users').findOne({email});
    if(user) {
      delete user.encryptedPassword;
    }
    return {user};
  }

  async submitEmail() {
    const {user, errors} = await this.findUserByEmail({email: this.email});
    if(errors) {
      this.errors = errors;
    } else {
      this.user = user;
      this.step = this.user ? 'login' : 'registration';
    }
  }

  renderEmailForm() {
    return (
      <form class="bg-white shadow p-4" onsubmit={this.submitEmail}>
        <div class="w-full pb-4 border-b">
          <input class="w-full border px-4 py-3" placeholder="What's your email?" type="email" bind="email" />
          {this.errors.email && <p class="mt-1 text-red-500"> {this.errors.email} </p>}
        </div>
        <div class="w-full pt-4">
          <button class="py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white w-full">Next</button>
        </div>
      </form>
    )
  }

  reset() {
    this.email = '';
    this.user = null;
    this.step = 'email';
  }

  static async attemptRegistration({database, request, email, password, name}) {
    const errors = {};
    const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(!regex.test(String(email).toLocaleLowerCase())) {
      errors.email = "Formato inválido";
    }
    if(String(password).length < 6) {
      errors.password = "Não pode ficar em branco";
    }
    if(String(password).length < 3) {
      errors.name = "Não pode ficar em branco";
    }
    if(Object.keys(errors).length) return {errors};
    const taken = await database.collection('users').findOne({email});
    if(taken) {
      errors.email = "Já está em uso";
      return {errors};
    }
    const {hash} = await import('bcryptjs');
    const encryptedPassword = await hash(password, 10);
    const data = await database.collection('users').insertOne({email, encryptedPassword, name});
    const user = {_id: data.ops[0]._id, name, email};
    request.session.user = email;
    return {user};
  }

  async submitRegistration(context) {
    const {user, errors} = await this.attemptRegistration({email: this.email, password: this.password, name: this.name});
    if(errors) {
      this.errors = errors;
    } else {
      context.user = user;
      if(context.router.url === '/login') {
        context.router.url = '/'
      }
    }
  }

  renderRegistrationForm() {
    return (
      <>
        <form class="bg-white shadow p-4" onsubmit={this.submitRegistration}>
          <div class="w-full pb-4 border-b">
            <p class="text-gray-600"> 
              The email <b>{this.email}</b> is not in the system yet, please fill the form bellow to create an account:
            </p>
            <button class="block text-center text-blue-500 hover:text-blue-500 mt-2" onclick={this.reset}> Go back and change email </button>
          </div>
          <div class="w-full py-4 border-b">
            <input class="w-full border px-4 py-3" type="text" bind="name" placeholder="Full Name" />
            {this.errors.name && <p class="mt-1 text-red-500"> {this.errors.name} </p>}
            <input class="w-full border px-4 py-3 mt-2" type="password" bind="password" placeholder="Password (minimum 6 characters)" />
            {this.errors.password && <p class="mt-1 text-red-500"> {this.errors.password} </p>}
          </div>
          <div class="w-full pt-4">
            <button class="py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white w-full">Create Account</button>
          </div>
        </form>
      </>
    )
  }

  static async attemptLogin({database, request, email, password}) {
    const errors = {};
    const user = await database.collection('users').findOne({email});
    if(!user) {
      errors.email = 'Email não encontrado';
      return {errors};
    }
    const {compare} = await import('bcryptjs');
    const passwordMatches = await compare(password, user.encryptedPassword);
    if(!passwordMatches) {
      errors.password = 'Senha incorreta';
      return {errors};
    }
    request.session.user = email;
    delete user.encryptedPassword;
    return {user};
  }

  async submitLogin(context) {
    const {user, errors} = await this.attemptLogin({email: this.email, password: this.password});
    if(errors) {
      this.errors = errors;
    } else {
      context.user = user;
      if(context.router.url === '/login') {
        context.router.url = '/'
      }
    }
  }

  renderLoginForm() {
    return (
      <>
        <form class="bg-white shadow p-4" onsubmit={this.submitLogin}>
          <div class="w-full pb-4 border-b">
            <p class="text-gray-600"> Welcome <b>{this.user.name}</b> </p>
            <button class="block text-center text-blue-500 hover:text-blue-500 mt-2" onclick={this.reset}> Go back and change email </button>
          </div>
          <div class="w-full py-4 border-b">
            <input class="w-full border px-4 py-3" type="password" bind="password" placeholder="Password" />
            {this.errors.password && <p class="mt-1 text-red-500"> {this.errors.password} </p>}
          </div>
          <div class="w-full pt-4">
            <button class="py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white w-full">Login</button>
          </div>
        </form>
      </>
    )
  }

  render() {
    return (
      <section class="flex">
        <div class="w-full md:w-1/3 lg:w-1/4 mx-auto p-4 mt-10">
          <div class="p-12">
            <img src="/nullstack.svg" class="w-full" />
          </div>
          {this.step == 'email' && <EmailForm />}
          {this.step == 'registration' && <RegistrationForm />}
          {this.step == 'login' && <LoginForm />}
        </div>
      </section>
    )
  }

}

export default Authentication;