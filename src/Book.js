import Nullstack from 'nullstack';

class Book extends Nullstack {

  title = '';
  summary = '';
  rating = 0;

  errors = {};

  static async findBookById({database, request, id}) {
    if(!request.session.id) return;
    const {ObjectId} = await import('mongodb');
    return await database.collection('books').findOne({_id: ObjectId(id)});
  }

  async initiate({params, router, metadata, environment}) {
    if(environment.server || !environment.prerendered) {
      if(params.id) {
        const book = await this.findBookById({id: params.id});
        if(book) {
          metadata.title = book.title;
          Object.assign(this, book);
        } else {
          router.url = '/';
        }
      } else {
        metadata.title = 'Add Book';
      }
    }
  }

  static async attemptInsertion({database, request, title, summary, rating, id}) {
    if(!request.session.user) return;
    const errors = {};
    if(!String(title).length) {
      errors.title = "Title can't be blank";
      return errors;
    }
    if(id) {
      const {ObjectId} = await import('mongodb');
      await database.collection('books').updateOne({
        _id: ObjectId(id)
      }, {
        $set: {title, summary, rating}
      });
      return {};
    } else {
      await database.collection('books').insertOne({title, summary, rating});
      return {};
    }
  }

  async save({router, params}) {
    this.errors = await this.attemptInsertion({title: this.title, summary: this.summary, rating: this.rating, id: params.id});
    if(!Object.keys(this.errors).length) {
      router.url = '/';
    }
  }

  render({metadata}) {
    return (
      <section class="container mx-auto">
        <form class="w-full bg-white shadow p-4" onsubmit={this.save}>
          <div class="w-full pb-4 border-b">
            <p class="text-gray-600"> {metadata.title} </p>
          </div>
          <div class="w-full py-4 border-b">
            <label class="block"> Book Title <abbr class="text-red-600" title="Obrigatório">*</abbr></label>
            <input class="w-full border px-4 py-3" type="text" bind="title" />
            {this.errors.title && <p class="mt-1 text-red-500"> {this.errors.title} </p>}
            <label class="mt-2 block"> Summary </label>
            <input class="w-full border px-4 py-3" type="text" bind="summary" />
            <label class="mt-2 block"> Rating </label>
            <input class="w-full border px-4 py-3" type="number" min="0" max="5" bind="rating" />
          </div>
          <div class="w-full pt-4">
            <button class="py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white w-full">Save</button>
          </div>
        </form>
      </section>
    )
  }

}

export default Book;