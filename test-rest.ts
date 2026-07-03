async function run() {
  const projectId = "principal-anchor-cfs6l";
  const databaseId = "ai-studio-weatherdashboard-a92ac380-a7aa-4fe6-8b5e-ea4dfec69808";
  const apiKey = "AIzaSyDNPPqV09S8Tb4tikuAPygEIZOZo2t06IQ";

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/users?key=${apiKey}`;
  console.log("Fetching REST URL:", url);

  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("REST Response status:", res.status);
    console.log("REST Response body:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("REST Fetch error:", err);
  }
}

run();
