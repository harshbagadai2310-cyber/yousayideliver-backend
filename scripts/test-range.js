const BACKEND_URL = 'http://localhost:5001/api';

const runTests = async () => {
  console.log('🏁 Starting GridFS Range Request API Verification...');

  try {
    // 1. Get all media files to find a file ID to test streaming
    console.log('\nStep 1: Listing stored files to obtain a target ID...');
    
    // Login to get token first
    const loginRes = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    const setCookie = loginRes.headers.get('set-cookie');
    if (!setCookie) {
      throw new Error('Could not acquire admin token to fetch file lists');
    }
    const cookie = setCookie.split(';')[0];

    const filesRes = await fetch(`${BACKEND_URL}/media/files`, {
      headers: { 'Cookie': cookie }
    });
    if (!filesRes.ok) {
      throw new Error(`Failed to list files: ${filesRes.status}`);
    }
    const files = await filesRes.json();
    if (files.length === 0) {
      console.log('⚠️ No files stored in DB yet. Please upload a file via the admin panel first to verify.');
      return;
    }

    const testFile = files[0];
    console.log(`✅ Success: Using file [${testFile.filename}] with ID [${testFile._id}] and size [${testFile.length} bytes]`);

    // 2. Request first 10 bytes using range request
    console.log('\nStep 2: Sending range request for bytes=0-9...');
    const rangeRes = await fetch(`${BACKEND_URL}/media/${testFile._id}`, {
      headers: {
        'Range': 'bytes=0-9'
      }
    });

    console.log(`✅ Received Status: ${rangeRes.status} (Expected: 206)`);
    console.log(`   - Accept-Ranges: ${rangeRes.headers.get('accept-ranges')}`);
    console.log(`   - Content-Range: ${rangeRes.headers.get('content-range')}`);
    console.log(`   - Content-Length: ${rangeRes.headers.get('content-length')}`);
    console.log(`   - Content-Type: ${rangeRes.headers.get('content-type')}`);

    if (rangeRes.status !== 206) {
      throw new Error(`Expected HTTP status 206 but received ${rangeRes.status}`);
    }
    if (rangeRes.headers.get('accept-ranges') !== 'bytes') {
      throw new Error('Missing or incorrect Accept-Ranges header');
    }
    if (!rangeRes.headers.get('content-range')?.startsWith('bytes 0-9/')) {
      throw new Error(`Incorrect Content-Range header: ${rangeRes.headers.get('content-range')}`);
    }
    if (parseInt(rangeRes.headers.get('content-length'), 10) !== 10) {
      throw new Error(`Incorrect Content-Length: ${rangeRes.headers.get('content-length')}`);
    }

    // 3. Read content bytes size
    const buffer = await rangeRes.arrayBuffer();
    console.log(`✅ Success: Received payload size: ${buffer.byteLength} bytes.`);
    if (buffer.byteLength !== 10) {
      throw new Error(`Expected 10 bytes payload but got ${buffer.byteLength}`);
    }

    console.log('\n🎉 ALL RANGE REQUEST TESTS PASSED SUCCESSFULLY! 🎉');
  } catch (error) {
    console.error('\n❌ RANGE VERIFICATION FAILED:', error.message);
    process.exit(1);
  }
};

runTests();
