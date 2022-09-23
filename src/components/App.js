import Header from './Header';
import Main from './Main';
import Footer from './Footer';
import PopupWithForm from './PopupWithForm';
import { useEffect, useState } from 'react';
import ImagePopup from './ImagePopup';
import api from '../utils/API';
import { CurrentUserContext } from '../contexts/CurrentUserContext';
import EditProfilePopup from './EditProfilePopup';
import EditAvatarPopup from './EditAvatarPopup';
import AddPlacePopup from './AddPlacePopup';
import Register from './Register';
import Login from './Login';
import { Route, Switch, useHistory } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import InfoTooltip from './InfoTooltip';
import * as auth from '../utils/auth';
import PopupWithMenu from './PopupWithMenu';

function App() {

  const [isEditAvatarPopupOpen, setAvatarPopupOpen] = useState(false);
  const [isEditProfilePopupOpen, setProfilePopupOpen] = useState(false);
  const [isAddPlacePopupOpen, setAddPlacePopupOpen] = useState(false);
  const [isInfoTooltipOpen, setInfoTooltipOpen] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState({});
  const [currentUser, setCurrentUser] = useState({});
  const [cards, setCards] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [status, setStatus] = useState(false);
  const [email, setEmail] = useState('');
  const history = useHistory();

  useEffect(() => {
    Promise.all([
      api.getUserData(),

      api.getInitialCards(),
    ])
      .then(([data, cards]) => {
        setCurrentUser(data);

        setCards(cards);
      })
      .catch((err) => {
        console.log(err);
      })
  }, [])

  useEffect(() => {
    const jwt = localStorage.getItem('token');
    if (jwt) {
      auth.checkToken(jwt)
        .then((res) => {
          setEmail(res.data.email);
          setLoggedIn(true);
          history.push('/');
        })
        .catch((err) => {
          console.log(err);
        })
    }
  }, [history])

  function handleEditAvatarClick() {
    setAvatarPopupOpen(true)
  }

  function handleEditProfileClick() {
    setProfilePopupOpen(true)
  }

  function handleAddPlaceClick() {
    setAddPlacePopupOpen(true)
  }

  function handleCardClick(card) {
    setSelectedCard(card)
  }

  function handleMenuClick() {
    setMenuOpen(!isMenuOpen)
  }

  function closeAllPopups() {
    setAvatarPopupOpen(false)
    setProfilePopupOpen(false)
    setAddPlacePopupOpen(false)
    setInfoTooltipOpen(false)
    setSelectedCard({})
  }

  const isOpen = isEditAvatarPopupOpen || isEditProfilePopupOpen || isAddPlacePopupOpen || selectedCard.link

  useEffect(() => {
    function closeByEscape(evt) {
      if (evt.key === 'Escape') {
        closeAllPopups();
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', closeByEscape);
      return () => {
        document.removeEventListener('keydown', closeByEscape);
      }
    }
  }, [isOpen])


  function handleCardLike(cards) {
    // Снова проверяем, есть ли уже лайк на этой карточке
    const isLiked = cards.likes.some(i => i._id === currentUser._id);

    // Отправляем запрос в API и получаем обновлённые данные карточки
    api.changeLikeCardStatus(cards._id, !isLiked)
      .then((newCard) => {
        setCards((state) => state.map((c) => c._id === cards._id ? newCard : c));
      })
      .catch((err) => {
        console.log(err);
      })
  }

  function handleDeleteCard(card) {
    api.deleteCard(card._id)
      .then(() => {
        setCards((cards) => cards.filter((item) => { //создайте копию массива, исключив из него удалённую карточку
          return item._id !== card._id
        }))
        closeAllPopups();
      })
      .catch((err) => {
        console.log(err);
      })
  };

  function handleUpdateUser(data) {
    setIsLoading(true);
    api.setUserData(data.name, data.about)
      .then((data) => {
        setCurrentUser(data);
        closeAllPopups();
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setIsLoading(false);
      })
  }

  function handleUpdateAvatar(data) {
    setIsLoading(true);
    api.setAvatar(data)
      .then((dataAvatar) => {
        setCurrentUser(dataAvatar)
        closeAllPopups();
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setIsLoading(false);
      })
  }

  function handleUpdateCard(card) {
    setIsLoading(true);
    api.createСard(card)
      .then((newCard) => {
        setCards([newCard, ...cards]);
        closeAllPopups();
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setIsLoading(false);
      })
  }

  function handleRegistration(email, password) {
    console.log(email)
    auth.register(email, password)
      .then((data) => {
        if (data) {
          setStatus(true)
          setInfoTooltipOpen(true)
          history.push('/sign-in');
        }
      })
      .catch((err) => {
        setStatus(false)
        setInfoTooltipOpen(true)
        console.log(err);
      })
  }

  function handleLogin(email, password) {
    auth.login(email, password)
      .then((data) => {
        if (data.token) {
          localStorage.setItem('token', data.token)
          setEmail(email);
          setLoggedIn(true);
          history.push('/');
        }
      })
      .catch((err) => {
        setInfoTooltipOpen(true);
        console.log(err);
      })
  }

  function handleLogOut() {
    localStorage.removeItem('token');
    setLoggedIn(false);
    history.push('/sign-in');
    setMenuOpen(!isMenuOpen)
  }


  return (
    <CurrentUserContext.Provider value={currentUser}>

      <div className="App">

        <PopupWithMenu isOpen={isMenuOpen} onClose={closeAllPopups} onLogOut={handleLogOut} email={email} />

        <Header onLogOut={handleLogOut} email={email} loggedIn={loggedIn} onMenu={handleMenuClick}/>

          <Switch>
            <ProtectedRoute exact path="/"
              onEditAvatar={handleEditAvatarClick}
              onEditProfile={handleEditProfileClick}
              onAddPlace={handleAddPlaceClick}
              onCardClick={handleCardClick}
              handleCardLike={handleCardLike}
              handleDeleteCard={handleDeleteCard}
              cards={cards}
              component={Main}
              loggedIn={loggedIn}
            />

            <Route path="/sign-in">
              <Login handleLogin={handleLogin} />
            </Route>
  
            <Route path="/sign-up">
              <Register handleRegistration={handleRegistration} />
            </Route>

          </Switch>

        {loggedIn && <Footer />}

        <PopupWithForm name="popup_delete_card" title="Вы уверены?" buttonText="Да" />

        <EditAvatarPopup
          isOpen={isEditAvatarPopupOpen}
          onClose={closeAllPopups}
          onUpdateAvatar={handleUpdateAvatar}
          isLoading={isLoading} />

        <EditProfilePopup
          isOpen={isEditProfilePopupOpen}
          onClose={closeAllPopups}
          onUpdateUser={handleUpdateUser}
          isLoading={isLoading} />

        <AddPlacePopup
          isOpen={isAddPlacePopupOpen}
          onClose={closeAllPopups}
          onAddPlace={handleUpdateCard}
          isLoading={isLoading} />

        <ImagePopup
          onClose={closeAllPopups}
          card={selectedCard} />

        <InfoTooltip
          isOpen={isInfoTooltipOpen}
          onClose={closeAllPopups}
          status={status} />

      </div>
    </CurrentUserContext.Provider >
  );
}

export default App;

//примечание к esc: Создаем переменную isOpen снаружи useEffect, в которой следим за всеми состояниями попапов. Если хоть одно состояние true или не null, то какой-то попап открыт, значит, навешивать нужно обработчик.Объявляем функцию внутри useEffect, чтобы она не теряла свою ссылку при обновлении компонента.И не забываем удалять обработчик в clean up функции через return. А также массив зависимостей c isOpen, чтобы отслеживать изменение этого показателя открытости. Как только он становится true, то навешивается обработчик, когда в false, тогда удаляется обработчик.