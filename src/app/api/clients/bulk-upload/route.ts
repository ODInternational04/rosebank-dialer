import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

interface BulkClientData {
  box_number?: string
  size?: string
  contract_no?: string
  principal_key_holder: string
  principal_key_holder_id_number?: string
  principal_key_holder_email_address: string
  telephone_cell: string
  telephone_home?: string
  contract_start_date?: string
  contract_end_date?: string
  occupation?: string
  notes?: string
  client_type: 'vault' | 'gold'
}

interface BulkUploadResponse {
  success: boolean
  inserted: number
  updated: number
  errors: Array<{ row: number; error: string; data: any }>
  details: {
    total: number
    processed: number
    skipped: number
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Only admin can perform bulk upload
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { clients, clientType, matchFields } = body as { 
      clients: BulkClientData[], 
      clientType: 'vault' | 'gold',
      matchFields?: string[]
    }

    if (!clients || !Array.isArray(clients) || clients.length === 0) {
      return NextResponse.json({ error: 'No client data provided' }, { status: 400 })
    }

    if (!clientType || !['vault', 'gold'].includes(clientType)) {
      return NextResponse.json({ error: 'Invalid client type' }, { status: 400 })
    }

    const response: BulkUploadResponse = {
      success: true,
      inserted: 0,
      updated: 0,
      errors: [],
      details: {
        total: clients.length,
        processed: 0,
        skipped: 0
      }
    }

    // Process each client
    for (let i = 0; i < clients.length; i++) {
      const clientData = clients[i]
      
      try {
        // Validate required fields based on client type
        if (clientType === 'vault') {
          if (!clientData.box_number || !clientData.contract_no) {
            response.errors.push({
              row: i + 1,
              error: 'Vault clients require box_number and contract_no',
              data: clientData
            })
            response.details.skipped++
            continue
          }
        }

        // Common required fields
        if (!clientData.principal_key_holder || !clientData.principal_key_holder_email_address || !clientData.telephone_cell) {
          response.errors.push({
            row: i + 1,
            error: 'Missing required fields: principal_key_holder, email, or telephone_cell',
            data: clientData
          })
          response.details.skipped++
          continue
        }

        // Prepare client data
        const preparedData: any = {
          client_type: clientType,
          principal_key_holder: clientData.principal_key_holder,
          principal_key_holder_email_address: clientData.principal_key_holder_email_address,
          telephone_cell: clientData.telephone_cell,
          telephone_home: clientData.telephone_home || '',
          notes: clientData.notes || '',
          created_by: decoded.userId,
          last_updated_by: decoded.userId,
        }

        // Add vault-specific fields
        if (clientType === 'vault') {
          preparedData.box_number = clientData.box_number
          preparedData.size = clientData.size || ''
          preparedData.contract_no = clientData.contract_no
          preparedData.principal_key_holder_id_number = clientData.principal_key_holder_id_number || ''
          preparedData.contract_start_date = clientData.contract_start_date || null
          preparedData.contract_end_date = clientData.contract_end_date || null
          preparedData.occupation = clientData.occupation || ''
        } else {
          // Gold clients - use auto-generated values for vault-specific fields
          const timestamp = Date.now()
          preparedData.box_number = `GOLD-${timestamp + i}`
          preparedData.contract_no = `GOLD-${timestamp + i}`
          preparedData.size = 'N/A'
          preparedData.principal_key_holder_id_number = ''
          preparedData.contract_start_date = null
          preparedData.contract_end_date = null
          preparedData.occupation = ''
        }

        // Check if client exists based on match fields
        let existingClient = null
        
        if (matchFields && matchFields.length > 0) {
          // Use custom match fields
          let query = supabase
            .from('clients')
            .select('id')
            .eq('client_type', clientType)
          
          // Build the query with all match conditions (AND logic)
          matchFields.forEach(field => {
            const value = clientData[field as keyof BulkClientData] || preparedData[field]
            if (value) {
              query = query.eq(field, value)
            }
          })
          
          const { data: existing } = await query.single()
          existingClient = existing
        } else {
          // Default matching logic (for backwards compatibility)
          if (clientType === 'vault') {
            // For vault: check by box_number or contract_no
            const { data: existing } = await supabase
              .from('clients')
              .select('id, box_number, contract_no')
              .eq('client_type', 'vault')
              .or(`box_number.eq.${clientData.box_number},contract_no.eq.${clientData.contract_no}`)
              .single()
            
            existingClient = existing
          } else {
            // For gold: check by email and phone combination
            const { data: existing } = await supabase
              .from('clients')
              .select('id')
              .eq('client_type', 'gold')
              .eq('principal_key_holder_email_address', clientData.principal_key_holder_email_address)
              .eq('telephone_cell', clientData.telephone_cell)
              .single()
            
            existingClient = existing
          }
        }

        if (existingClient) {
          // Update existing client
          const { error: updateError } = await supabase
            .from('clients')
            .update({
              ...preparedData,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingClient.id)

          if (updateError) {
            response.errors.push({
              row: i + 1,
              error: `Update failed: ${updateError.message}`,
              data: clientData
            })
            response.details.skipped++
          } else {
            response.updated++
            response.details.processed++
          }
        } else {
          // Insert new client
          const { error: insertError } = await supabase
            .from('clients')
            .insert(preparedData)

          if (insertError) {
            response.errors.push({
              row: i + 1,
              error: `Insert failed: ${insertError.message}`,
              data: clientData
            })
            response.details.skipped++
          } else {
            response.inserted++
            response.details.processed++
          }
        }
      } catch (error: any) {
        response.errors.push({
          row: i + 1,
          error: error.message || 'Unknown error',
          data: clientData
        })
        response.details.skipped++
      }
    }

    response.success = response.errors.length < clients.length

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Error in bulk upload:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
