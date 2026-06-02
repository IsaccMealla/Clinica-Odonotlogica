// FILE: frontend/lib/permissions.ts
export function getUserRole(): string {
  try {
    return (localStorage.getItem('user_role') || '')
  } catch {
    return ''
  }
}

export function getUserPermissionsRaw(): any {
  try {
    const p = localStorage.getItem('user_permissions')
    return p ? JSON.parse(p) : null
  } catch {
    return null
  }
}

export function hasPermission(key: string): boolean {
  try {
    const role = (localStorage.getItem('user_role') || '').toUpperCase()
    const isSuperuser = localStorage.getItem('is_superuser') === 'true'

    // Bypass de Admin: El administrador tiene todos los permisos
    if (isSuperuser || role === 'ADMIN' || role === 'ADMINISTRADOR') {
      return true
    }

    const perms = getUserPermissionsRaw()
    if (!perms) return false
    if (Array.isArray(perms)) return perms.includes(key)
    if (typeof perms === 'object') return !!perms[key]
    return false
  } catch {
    return false
  }
}

export async function loadMe(){
  const url = 'http://localhost:8000/api/usuarios/me/'
  try{
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
      }
    })

    if(!res.ok) throw new Error('me fetch failed')
    const data = await res.json()
    if(data.rol) localStorage.setItem('user_role', data.rol)
    if(data.permissions) localStorage.setItem('user_permissions', JSON.stringify(data.permissions))
    return data
  }catch(e){
    // Fallback mock to avoid app breakage
    const existingRole = localStorage.getItem('user_role') || 'ADMIN'
    
    // Attempt to load permissions from the demo roles
    let mockPerms: any = {}
    try {
      const storedRoles = localStorage.getItem('roles_demo')
      if (storedRoles) {
        const roles = JSON.parse(storedRoles)
        const found = roles.find((r: any) => r.name === existingRole)
        if (found) {
          mockPerms = found.permissions
        }
      }
    } catch (_) {}

    try{
      localStorage.setItem('user_role', existingRole)
      localStorage.setItem('user_permissions', JSON.stringify(mockPerms))
    }catch(_){ }
    return { rol: existingRole, permissions: mockPerms }
  }
}