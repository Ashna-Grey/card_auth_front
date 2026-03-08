const backend = "https://card-auth-updated.onrender.com"
function getFile(){
const fileInput = document.getElementById("fileInput")
if(fileInput.files.length === 0){
alert("Upload dataset first")
return null
}
return fileInput.files[0]
}
function createFormData(file){
const formData = new FormData()
formData.append("file", file)
return formData
}
async function detectSchema(){
const file = getFile()
if(!file) return
const res = await fetch(`${backend}/detect_schema`,{
method:"POST",
body:createFormData(file)
})
const data = await res.json()
document.getElementById("schemaOutput").innerText =
JSON.stringify(data,null,2)
}
async function datasetInfo(){
const file = getFile()
if(!file) return
const res = await fetch(`${backend}/dataset_info`,{
method:"POST",
body:createFormData(file)
})
const data = await res.json()
document.getElementById("schemaOutput").innerText =
JSON.stringify(data,null,2)
}
async function runAnalysis(){
const file = getFile()
if(!file) return
const res = await fetch(`${backend}/analyze`,{
method:"POST",
body:createFormData(file)
})
const data = await res.json()
displayResults(data.suspicious_cards)
}
function displayResults(cards){
const table = document.querySelector("#resultTable tbody")
table.innerHTML = ""
cards.forEach(card=>{
const row = document.createElement("tr")
row.innerHTML = `
<td>${card.card_number}</td>
<td>${card.transactions}</td>
<td>${card.unique_ips}</td>
<td>${card.risk_score}</td>
<td>${card.risk_level}</td>
<td>${card.fraud_patterns.join(", ")}</td>
`
table.appendChild(row)
})
}
async function generateNetwork(){
const file = getFile()
if(!file) return
const res = await fetch(`${backend}/fraud_network`,{
method:"POST",
body:createFormData(file)
})
const data = await res.json()
renderGraph(data)
}
function renderGraph(data){
const container = document.getElementById("networkGraph")
const nodes = new vis.DataSet(
data.nodes.map(n => ({
id:n.id,
label:n.id,
color: n.type === "card" ? "#ff7675" : "#74b9ff"
}))
)
const edges = new vis.DataSet(
data.edges.map(e => ({
from:e.source,
to:e.target
}))
)
const graphData = {
nodes:nodes,
edges:edges
}
const options = {
nodes:{
shape:"dot",
size:15
},
physics:{
enabled:true
}
}
new vis.Network(container, graphData, options)
}
async function viewMetrics(){
const res = await fetch(`${backend}/metrics`)
const data = await res.json()
document.getElementById("metricsOutput").innerText =
JSON.stringify(data,null,2)
}
async function viewDashboard(){
const res = await fetch(`${backend}/dashboard`)
const data = await res.json()
document.getElementById("metricsOutput").innerText =
JSON.stringify(data,null,2)
}
