const BACKEND_URL = 'http://localhost:5001/api';
let cookieHeaderValue = '';

const runTests = async () => {
  console.log('🏁 Starting Blogs API Integration Test Suite with Native fetch...');

  try {
    // 1. Fetch public published blogs (should be 3 from seed)
    console.log('\nStep 1: Fetching public published blogs...');
    const publicRes = await fetch(`${BACKEND_URL}/blogs`);
    if (!publicRes.ok) {
      throw new Error(`Failed to fetch public blogs: ${publicRes.status}`);
    }
    const publicBlogs = await publicRes.json();
    console.log(`✅ Success: Received ${publicBlogs.length} published blogs.`);
    publicBlogs.forEach(b => console.log(`   - [${b.slug}] ${b.title}`));

    if (publicBlogs.length < 3) {
      throw new Error('Seeded blogs were not fetched. Did you run the seed script?');
    }

    // 2. Perform admin authentication login
    console.log('\nStep 2: Authenticating as Admin...');
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

    // Extract token from cookies
    const setCookie = loginRes.headers.get('set-cookie');
    if (!setCookie) {
      throw new Error('Failed to acquire HttpOnly authentication cookies from response headers');
    }
    cookieHeaderValue = setCookie.split(';')[0];
    console.log('✅ Admin login succeeded. Cookie acquired:', cookieHeaderValue);

    // 3. Create a new draft blog post
    console.log('\nStep 3: Creating a new draft blog post...');
    const draftRes = await fetch(`${BACKEND_URL}/blogs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeaderValue
      },
      body: JSON.stringify({
        title: 'Diagnostic System Blueprints for Scale-Ups',
        summary: 'How we blueprint business requirements to build high performance architectures.',
        content: '<p>Standardizing system requirements avoids feature creep...</p>',
        tags: ['Strategy', 'Automation'],
        published: false
      })
    });
    
    if (!draftRes.ok) {
      throw new Error(`Failed to create draft blog: ${draftRes.status}`);
    }
    const newBlog = await draftRes.json();
    console.log(`✅ Success: Created draft blog with ID ${newBlog._id}`);
    console.log(`   - Generated Slug: ${newBlog.slug}`);

    // 4. Retrieve all blogs (including draft)
    console.log('\nStep 4: Fetching all blogs (Admin listing)...');
    const allRes = await fetch(`${BACKEND_URL}/blogs/all`, {
      headers: { 'Cookie': cookieHeaderValue }
    });
    if (!allRes.ok) {
      throw new Error(`Failed to fetch all blogs: ${allRes.status}`);
    }
    const allBlogs = await allRes.json();
    console.log(`✅ Success: Received ${allBlogs.length} total blogs.`);
    const foundNew = allBlogs.find(b => b._id === newBlog._id);
    if (!foundNew) {
      throw new Error('New draft blog not found in Admin catalog');
    }
    console.log(`   - Status of new blog: ${foundNew.published ? 'Published' : 'Draft'}`);

    // 5. Fetch single blog by slug
    console.log(`\nStep 5: Fetching single post by slug [${newBlog.slug}]...`);
    const singleRes = await fetch(`${BACKEND_URL}/blogs/post/${newBlog.slug}`);
    if (!singleRes.ok) {
      throw new Error(`Failed to fetch blog by slug: ${singleRes.status}`);
    }
    const singleBlog = await singleRes.json();
    console.log(`✅ Success: Fetched blog matching slug.`);
    console.log(`   - Title: ${singleBlog.title}`);

    // 6. Update draft blog to published
    console.log('\nStep 6: Publishing the draft blog...');
    const updateRes = await fetch(`${BACKEND_URL}/blogs/${newBlog._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeaderValue
      },
      body: JSON.stringify({
        published: true
      })
    });
    if (!updateRes.ok) {
      throw new Error(`Failed to update blog to published: ${updateRes.status}`);
    }
    const updatedBlog = await updateRes.json();
    console.log(`✅ Success: Updated blog publish state.`);
    console.log(`   - New Published State: ${updatedBlog.published}`);

    // 7. Verify it is now in the public list
    console.log('\nStep 7: Verifying new blog in public listings...');
    const publicResAfter = await fetch(`${BACKEND_URL}/blogs`);
    if (!publicResAfter.ok) {
      throw new Error(`Failed to fetch public blogs: ${publicResAfter.status}`);
    }
    const publicBlogsAfter = await publicResAfter.json();
    console.log(`✅ Success: Received ${publicBlogsAfter.length} published blogs.`);
    const publishedFound = publicBlogsAfter.find(b => b._id === newBlog._id);
    if (!publishedFound) {
      throw new Error('Newly published blog is not showing in public list');
    }
    console.log('   - Confirmed: Blog is now visible to guests.');

    // 8. Delete the blog post
    console.log('\nStep 8: Deleting the blog post...');
    const deleteRes = await fetch(`${BACKEND_URL}/blogs/${newBlog._id}`, {
      method: 'DELETE',
      headers: { 'Cookie': cookieHeaderValue }
    });
    if (!deleteRes.ok) {
      throw new Error(`Failed to delete blog post: ${deleteRes.status}`);
    }
    const deleteResult = await deleteRes.json();
    console.log(`✅ Success: Received delete confirm response:`, deleteResult);

    // 9. Confirm it was deleted
    console.log('\nStep 9: Confirming cleanup deletion...');
    const publicResFinal = await fetch(`${BACKEND_URL}/blogs`);
    if (!publicResFinal.ok) {
      throw new Error(`Failed to fetch public list: ${publicResFinal.status}`);
    }
    const publicBlogsFinal = await publicResFinal.json();
    const cleanupFound = publicBlogsFinal.find(b => b._id === newBlog._id);
    if (cleanupFound) {
      throw new Error('Blog post was not deleted successfully');
    }
    console.log(`✅ Success: Verified deletion. Catalog size returned to ${publicBlogsFinal.length}`);

    console.log('\n🎉 ALL BLOG API INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉');
  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED with error:', error.message);
    process.exit(1);
  }
};

runTests();
