import Nullstack from 'nullstack';

class Books extends Nullstack {

  books = [];
  
  static async findBooks({database}) {
    return await database.collection('books').find().toArray();
  }

  async initiate({metadata, environment}) {
    if(environment.server || !environment.prerendered) {
      this.books = await this.findBooks();
      metadata.title = `${this.books.length} Books`;
    }
  }

  renderBook({user, book}) {
    return (
      <li class="w-full bg-white shadow p-4 m-1">
        <div class="border-b pb-4 flex mb-4">
          <h3 class="text-gray-700 w-9/12">{book.title}</h3>
          <p class="text-gray-700 w-3/12 text-right font-bold">({book.rating}) Stars</p>
        </div>
        {!!book.summary && <p class="text-gray-500"> {book.summary} </p>}
        <a class="text-blue-500 hover:text-blue-600 mt-2 block" href={`/book/${book._id}`}> 
          Edit Book {!user && '(Requires Account)'}
        </a>
      </li>
    )
  }

  render() {
    return (
      <section class="container mx-auto">
        <ul class="grid grid-cols-1 md:grid-cols-3">
          {this.books.map((book) => <Book book={book} />)}
        </ul>
      </section>
    )
  }

}

export default Books;