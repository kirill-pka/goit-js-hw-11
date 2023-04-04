import '../sass/index.scss';
import ImageService from './fetchImg';
import Notiflix from 'notiflix';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

class Gallery {
  #refs = {};
  #searchQuery = null;
  #response = [];
  #lightbox = new SimpleLightbox('.gallery a', {});
  

  init() {
    this.#initRefs();
    this.#initListeners();
  }

  #initRefs() {
    this.#refs.searchForm = document.querySelector('.search-form');
    this.#refs.gallery = document.querySelector('.gallery');
    this.#refs.loadMore = document.querySelector('.load-more');
  }

  #initListeners() {
    this.#refs.searchForm.addEventListener('submit', this.#onSearch.bind(this));
    this.#refs.loadMore.addEventListener('click', this.#onClickLoadMoreBtn.bind(this));
    this.#refs.loadMore.classList.add('btn-hidden');
  }

  #onSearch(e) {
    e.preventDefault();
    this.#searchQuery = e.currentTarget.elements.searchQuery.value;

    if (!this.#searchQuery) {
      return Notiflix.Notify.warning('Please enter a search query');
    }

    ImageService.resetPage();
    this.#resetGallery();
    this.#fetchImg()
      .then(response => {
        if (response.hits.length === 0) {
          return Notiflix.Notify.failure(
            'Sorry, there are no images matching your search query. Please try again.'
          );
        }

        this.#updateImg(response);
      })
      .finally(() => {
        e.target.reset();
      });
  }

  #resetGallery() {
    this.#response = [];
    this.#refs.gallery.innerHTML = '';
  }

  #fetchImg() {
    return ImageService.fetchData(this.#searchQuery)
      .then(response => response)
      .catch(error => {
        console.error(error);
        Notiflix.Notify.failure('Something went wrong. Please try later');
      });
  }

  #loadMore() {
    ImageService.incrementPage();

    if (ImageService.page > ImageService.quantityPages) {
      Notiflix.Notify.info(
        'We are sorry, but you have reached the end of search results.'
      );
      this.#refs.loadMore.classList.add('btn-hidden');
    }

    return this.#fetchImg().then(response => {
      const newPict = response.hits;
      this.#response.hits.splice(this.#response.hits.length, 0, ...newPict);
      this.#render(newPict);
      this.#toggleMoreButton();
    });
  }
  
  #onClickLoadMoreBtn() {
    this.#refs.loadMore.disabled = true;

    this.#loadMore().finally(() => {
      this.#refs.loadMore.disabled = false;
    });
  }

  #updateImg(response) {
    this.#response = response;
    let arrays = this.#response.hits;
    this.#render(arrays);
    this.#toggleMoreButton();
  }

  #render(arrays) {
    let markup = arrays
    .map(
      hits => `
      <div class="photo-card">
        <a href="${hits.largeImageURL}" data-caption="${hits.tags}">
          <img src="${hits.webformatURL}" alt="${hits.tags}" loading="lazy" />
        </a>
        <div class="info">
          <p class="info-item">
            <b>Likes</b>
            <b>${hits.likes}</b>
          </p>
          <p class="info-item">
            <b>Views</b>
            <b>${hits.views}</b>
          </p>
          <p class="info-item">
            <b>Comments</b>
            <b>${hits.comments}</b>
          </p>
          <p class="info-item">
            <b>Downloads</b>
            <b>${hits.downloads}</b>
          </p>
        </div>
      </div>
    `
    )
    .join('');
    this.#refs.gallery.insertAdjacentHTML('beforeend', markup);
    this.#lightbox.refresh();
  }

  #toggleMoreButton() {
    if (
      this.#response.hits.length > 0 &&
      ImageService.page < ImageService.quantityPages
    ) {
      this.#refs.loadMore.classList.remove('btn-hidden');
    } else {
      this.#refs.loadMore.classList.add('btn-hidden');
    }
  }
}

const newGallery = new Gallery();
newGallery.init();
