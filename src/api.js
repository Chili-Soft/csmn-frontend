import Axios from 'axios'


export function getConfig() {
    return Axios.get('/api/config');
}
