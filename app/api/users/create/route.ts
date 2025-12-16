import { createClient } from '@supabase/supabase-js'
import { createSupabaseClient } from '@/lib/supabase/client'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    // First verify the requesting user is an admin
    const supabase = createSupabaseClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: currentProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single()

    if (!currentProfile || currentProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { email, password, full_name, role, organization_id } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    // Create admin client with service role
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Create auth user
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    // Create user profile
    const { data: profile, error: profileError } = await adminClient
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email,
        full_name: full_name || null,
        role: role || 'site_manager',
        organization_id: organization_id || null,
      })
      .select(`
        *,
        organization:organizations(*)
      `)
      .single()

    if (profileError) {
      console.error('Profile error:', profileError)
      // Try to clean up the auth user if profile creation fails
      await adminClient.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 })
    }

    return NextResponse.json({ user: profile }, { status: 201 })
  } catch (error: any) {
    console.error('Create user error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

