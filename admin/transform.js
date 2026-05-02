const fs = require('fs');
const file = 'app/(dashboard)/products/view/[id]/page.js';
let content = fs.readFileSync(file, 'utf8');

// Name Change
content = content.replace(/function EditProduct\(\)/g, 'function ViewProduct()');
content = content.replace(/export default withPermission\(EditProduct, 'products', 'edit'\);/g, 'export default withPermission(ViewProduct, \'products\', \'view\');');

// Hide specific buttons
content = content.replace(/<button[^>]*>\s*<FontAwesomeIcon icon=\{faSave\}[^>]*\/>\s*Save Product\s*<\/button>/g, '');
content = content.replace(/<button[^>]*>\s*Update SEO\s*<\/button>/g, '');
content = content.replace(/<button[^>]*onClick=\{handle[^}]*\}[^>]*>\s*<FontAwesomeIcon icon=\{faFileUpload\}[^>]*\/>\s*Upload\s*<\/button>/g, '');

// File upload / removal buttons
content = content.replace(/<span[^>]*onClick=\{[^}]*\}[^>]*>\s*<FontAwesomeIcon icon=\{faTimes\}[^>]*\/>\s*<\/span>/g, '<span className="hidden"></span>');
content = content.replace(/<button[^>]*onClick=\{remove[^}]*\}[^>]*>[\s\S]*?<\/button>/g, '');
content = content.replace(/<button[^>]*onClick=\{add[^}]*\}[^>]*>[\s\S]*?<\/button>/g, '');
content = content.replace(/<button[^>]*onClick=\{startEdit[^}]*\}[^>]*>[\s\S]*?<\/button>/g, '');
content = content.replace(/<div className="mt-6 flex justify-end"><button type="submit"[^>]*>.*Save Product.*<\/button><\/div>/g, '');
content = content.replace(/<div[^>]*className=[^>]*mt-6 flex justify-end[^>]*>[\s\S]*?<\/div>/g, '');
content = content.replace(/type="file"/g, 'type="file" disabled');

// Form wrap to disable everything!
content = content.replace(/<form onSubmit=\{handleSubmit\} className="space-y-6">/g, '<form className="space-y-6"><fieldset disabled>');
content = content.replace(/<\/form>/g, '</fieldset></form>');

// Add CreatedAt / UpdatedAt underneath the Title!
const timestampHtml = `
            <div className="flex justify-between items-center bg-[#130C1C] p-4 rounded-xl border border-[#2d1b4e] shadow-lg mb-6">
                <div>
                    <span className="text-gray-500 text-xs uppercase tracking-widest block mb-1">Created On</span>
                    <span className="text-[#a78bfa] font-mono text-sm">{formData.createdAt ? new Date(formData.createdAt).toLocaleString('en-US') : '-'}</span>
                </div>
                <div className="text-right">
                    <span className="text-gray-500 text-xs uppercase tracking-widest block mb-1">Last Updated</span>
                    <span className="text-emerald-400 font-mono text-sm">{formData.updatedAt ? new Date(formData.updatedAt).toLocaleString('en-US') : '-'}</span>
                </div>
            </div>
`;
content = content.replace(/<form className="space-y-6">/g, timestampHtml + '\n            <form className="space-y-6">');

// We also need to get createdAt/updatedAt into formData
content = content.replace(/canonical_url: product\.canonical_url \|\| ''/g, 'canonical_url: product.canonical_url || \'\',\n                        createdAt: product.createdAt,\n                        updatedAt: product.updatedAt');


fs.writeFileSync(file, content);
console.log('Done transforming to View.js');
