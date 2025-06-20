export const EQUIPOS = {
  equipoA: {
    id: 'equipoA',
    nombre: 'Extech 45170',
    modeloApi: 'Extech 45170' // Nombre exacto como aparece en la API
  },
  equipoB: {
    id: 'equipoB',
    nombre: 'Testo 425',
    modeloApi: 'Testo 425'
  },
  equipoC: {
    id: 'equipoC',
    nombre: 'Extech HS 680',
    modeloApi: 'Extech HS 680'
  }
};

export const getEquipoById = (id) => EQUIPOS[id] || EQUIPOS.equipoA;
export const getModeloApi = (id) => getEquipoById(id).modeloApi;