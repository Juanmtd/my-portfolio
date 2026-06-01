const STATE = {

  view: 'dashboard',

  owner: null,

  loading: false,

  data: null,

  error: null,

  // Auth
  auth: {
    user: null,       // { name, email, picture }
    canView: [],      // lista de owners que puede ver
    ready: false      // true cuando el login ya fue comprobado
  }

};

window.STATE = STATE;
