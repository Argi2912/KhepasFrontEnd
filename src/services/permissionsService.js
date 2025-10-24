import api from './api'

const resourse = '/permissions/'

export default {
  getAllPermissions() {
    return api.get(resourse)
  },
  createPermission(permissionData) {
    return api.post(resourse, permissionData)
  },
  createRole(roleData) {
    return api.post(resourse + 'role', roleData)
  },

  updateRole(id, roleData) {
  return api.put(`/permissions/role/${id}`, roleData)
},


  rolePermissions(data) {
    return api.post(resourse + 'role-permissions', data)
  },
  userRole(data) {
    return api.post(resourse + 'user-roles', data)
  },
  userPermissions(data) {
    return api.post(resourse + 'user-permissions', data)
  },
}
