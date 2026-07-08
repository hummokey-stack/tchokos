import { supabase } from '/client/js/supabaseClient.js'

export async function checkAuth() {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    window.location.href = '/admin/login.html'
    return null
  }

  try {
    // Get user profile details
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (error || !profile || !profile.role) {
      console.warn('Utilisateur authentifié mais sans profil admin valide.')
      await supabase.auth.signOut()
      window.location.href = '/admin/login.html'
      return null
    }

    return { user: session.user, profile }
  } catch (err) {
    console.error('Erreur verification auth admin:', err)
    window.location.href = '/admin/login.html'
    return null
  }
}

export async function setupLogout() {
  const logoutBtn = document.getElementById('admin-logout')
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault()
      await supabase.auth.signOut()
      window.location.href = '/admin/login.html'
    })
  }
}
