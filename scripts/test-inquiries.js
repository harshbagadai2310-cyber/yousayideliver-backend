const BACKEND_URL = 'http://localhost:5001/api';
let cookieHeaderValue = '';

const runTests = async () => {
  console.log('🏁 Starting Inquiries API Integration Test Suite...');

  try {
    // 1. Submit invalid inquiry (missing email/location)
    console.log('\nStep 1: Submitting invalid inquiry (should fail validation)...');
    const invalidRes = await fetch(`${BACKEND_URL}/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Tony Stark',
        companyName: 'Stark Industries',
        details: 'Need a premium branding portal for Avengers HQ'
      })
    });
    
    if (invalidRes.status === 400) {
      console.log('✅ Success: Server rejected missing fields with 400 Bad Request.');
    } else {
      throw new Error(`Expected 400 Bad Request, but received ${invalidRes.status}`);
    }

    // 2. Submit valid inquiry
    console.log('\nStep 2: Submitting a valid client inquiry...');
    const validRes = await fetch(`${BACKEND_URL}/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Tony Stark',
        companyName: 'Stark Industries',
        email: 'tony@stark.com',
        location: 'New York, USA',
        phone: '+1 123 456 7890',
        details: 'Need a premium branding portal and high-conversion software for Stark Industries.'
      })
    });

    if (!validRes.ok) {
      throw new Error(`Failed to submit valid inquiry: ${validRes.status}`);
    }
    const responseData = await validRes.json();
    const newInquiry = responseData.inquiry;
    console.log(`✅ Success: Inquiry registered. ID: ${newInquiry._id}`);
    console.log(`   - Name: ${newInquiry.name}`);
    console.log(`   - Location: ${newInquiry.location}`);
    console.log(`   - Status: ${newInquiry.status}`);

    // 3. Perform admin authentication login
    console.log('\nStep 3: Authenticating as Admin...');
    const loginRes = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    if (!loginRes.ok) {
      throw new Error(`Admin login failed: ${loginRes.status}`);
    }

    const setCookie = loginRes.headers.get('set-cookie');
    if (!setCookie) {
      throw new Error('Failed to acquire HttpOnly authentication cookies');
    }
    cookieHeaderValue = setCookie.split(';')[0];
    console.log('✅ Admin login succeeded. Cookie acquired:', cookieHeaderValue);

    // 4. Retrieve all inquiries (Admin listing)
    console.log('\nStep 4: Fetching all inquiries (Admin listing)...');
    const allRes = await fetch(`${BACKEND_URL}/inquiries`, {
      headers: { 'Cookie': cookieHeaderValue }
    });
    
    if (!allRes.ok) {
      throw new Error(`Failed to fetch inquiries: ${allRes.status}`);
    }
    const allInquiries = await allRes.json();
    console.log(`✅ Success: Received ${allInquiries.length} total inquiries.`);
    const foundNew = allInquiries.find(i => i._id === newInquiry._id);
    if (!foundNew) {
      throw new Error('Newly created inquiry not found in Admin catalog');
    }
    console.log(`   - Confirmed: New inquiry from ${foundNew.name} is present in admin database.`);

    // 5. Update inquiry status
    console.log('\nStep 5: Updating inquiry status to "Reviewed"...');
    const updateRes = await fetch(`${BACKEND_URL}/inquiries/${newInquiry._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeaderValue
      },
      body: JSON.stringify({
        status: 'Reviewed'
      })
    });

    if (!updateRes.ok) {
      throw new Error(`Failed to update inquiry status: ${updateRes.status}`);
    }
    const updatedInquiry = await updateRes.json();
    console.log(`✅ Success: Updated status.`);
    console.log(`   - New Status: ${updatedInquiry.status}`);

    // 6. Delete the inquiry post
    console.log('\nStep 6: Deleting the inquiry post...');
    const deleteRes = await fetch(`${BACKEND_URL}/inquiries/${newInquiry._id}`, {
      method: 'DELETE',
      headers: { 'Cookie': cookieHeaderValue }
    });
    if (!deleteRes.ok) {
      throw new Error(`Failed to delete inquiry: ${deleteRes.status}`);
    }
    const deleteResult = await deleteRes.json();
    console.log(`✅ Success: Received delete confirm response:`, deleteResult);

    // 7. Confirm it was deleted
    console.log('\nStep 7: Confirming cleanup deletion...');
    const listResAfter = await fetch(`${BACKEND_URL}/inquiries`, {
      headers: { 'Cookie': cookieHeaderValue }
    });
    if (!listResAfter.ok) {
      throw new Error(`Failed to fetch inquiries list: ${listResAfter.status}`);
    }
    const listFinal = await listResAfter.json();
    const cleanupFound = listFinal.find(i => i._id === newInquiry._id);
    if (cleanupFound) {
      throw new Error('Inquiry was not deleted successfully');
    }
    console.log(`✅ Success: Verified deletion. Admin list size returned to ${listFinal.length}`);

    console.log('\n🎉 ALL INQUIRY API INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉');
  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED with error:', error.message);
    process.exit(1);
  }
};

runTests();
