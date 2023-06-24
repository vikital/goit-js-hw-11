import Notiflix from 'notiflix';
import axios from 'axios';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

const refs = {
  form: document.querySelector('.search-form'),
  gallery: document.querySelector('.gallery'),
  btn: document.querySelector('.load-more'),
};

let currentPage = 1;
let inputValue = '';

refs.form.addEventListener('submit', handleSubmit);

const lightbox = new SimpleLightbox('.gallery a', {
  captionsData: 'alt',
  captionPosition: 'bottom',
  captionDelay: 250,
  disableScroll: false,
});

refs.btn.addEventListener('click', handleLoadMore);

async function handleSubmit(event) {
  event.preventDefault();
  inputValue = event.target.elements.searchQuery.value;
  console.log(inputValue);
  refs.gallery.innerHTML = '';

  if (inputValue === '') {
    showError();
    hideLoadMoreButton();
    return;
  }

  try {
    const result = await getData(inputValue, (currentPage = 1));
    if (result.hits.length === 0) {
      showError();
      return;
    }

    createGallery(result.hits);
    lightbox.refresh();

    checkLoadMoreOption(result);
    currentPage++;
  } catch (error) {
    showError();
  }
}

function checkLoadMoreOption(result) {
  if (result.totalHits > currentPage * 40) {
    showLoadMoreButton();
  } else {
    hideLoadMoreButton();
    Notiflix.Notify.info(
      "We're sorry, but you've reached the end of search results."
    );
  }
}

function handleLoadMore() {
  getData(inputValue, currentPage)
    .then(result => {
      if (result.hits.length === 0) {
        showError();
        return;
      }
      createGallery(result.hits);

      lightbox.refresh();

      if (result.totalHits > currentPage * 40) {
        showLoadMoreButton();
      } else {
        hideLoadMoreButton();
        Notiflix.Notify.info(
          "We're sorry, but you've reached the end of search results."
        );
      }

      currentPage++;
      Notiflix.Notify.success(`Hooray! We found ${result.totalHits} images.`);

      const { height: cardHeight } = document
        .querySelector('.gallery')
        .firstElementChild.getBoundingClientRect();

      window.scrollBy({
        top: cardHeight * 2,
        behavior: 'smooth',
      });
    })
    .catch(error => {
      Notiflix.Notify.failure(
        'An error occurred while fetching the images. Please try again.'
      );
    });
}

async function getData(inputValue, page = 1) {
  try {
    const response = await axios.get('https://pixabay.com/api/', {
      params: {
        key: '37421365-508677d6bf0e4f2b0f58d3593',
        q: inputValue,
        image_type: 'photo',
        orientation: 'horizontal',
        safesearch: true,
        per_page: 40,
        page: page,
      },
    });

    return response.data;
  } catch (error) {
    Notiflix.Notify.failure(
      'An error occurred while fetching the images. Please try again.'
    );
  }
}

function createGallery(result) {
  let markup = result
    .map(
      ({
        webformatURL,
        largeImageURL,
        tags,
        likes,
        views,
        comments,
        downloads,
      }) => {
        return `<div class="gallery-item">
        <a href="${largeImageURL}"><img src="${webformatURL}" alt="${tags}" loading="lazy" class="gallery-image"/></a>
        <div class="info">
          <p class="info-item">
            <b>Likes ${likes}</b>
          </p>
                <p class="info-item">
                  <b>Views ${views}</b>
                </p>
                <p class="info-item">
                  <b>Comments ${comments}</b>
                </p>
                <p class="info-item">
                  <b>Downloads ${downloads}</b>
          </p>
        </div>
      </div>`;
      }
    )
    .join('');

  refs.gallery.insertAdjacentHTML('beforeend', markup);
}

function showError() {
  Notiflix.Notify.failure(
    'Sorry, there are no images matching your search query. Please try again.'
  );
}
function showLoadMoreButton() {
  refs.btn.style.display = 'block';
}

function hideLoadMoreButton() {
  refs.btn.style.display = 'none';
}
