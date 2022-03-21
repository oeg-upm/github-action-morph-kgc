const core =  require('@actions/core');
const github = require('@actions/github');
const { http, https } = require('follow-redirects');
const fs = require('fs');

async function main() {
    try {
        // take the input token for the action
        const owner = core.getInput('owner', { required: true });
        const repo = core.getInput('repo', { required: true });
        const pr_number = core.getInput('pr_number', { required: true });
        const token = core.getInput('token', { required: true });

        // Instance of Octokit to call the API
        const octokit = new github.getOctokit(token);

        const { data: changedFiles } = await octokit.rest.pulls.listFiles({
            owner,
            repo,
            pull_number: pr_number,
        });

        for (const file of changedFiles) {
            const fle = file.filename.split('.');
		    const file_extension = fle.pop();
            
            console.log('El file es:: ')
            console.log(file)
            console.log('The file extension is:: ' + file_extension)

            switch (file_extension) {
                case 'json':
                case 'xml':
                case 'csv':
                case 'tsv':
                case 'xlsx':
                case 'parquet': 
                case 'orc': 
                case 'dta':
                case 'sas':
                case 'sav':
                case 'ods':
                    console.log('inside switch-case --> file_extension')
                    core.setOutput('run', true);
                    break;
            }
            switch (file_extension) {
                case 'r2rml':
                case 'rml':
                    console.log('inside switch-case --> file_extension')
                    if(fs.mkdirSync('./morphkgc/', { recursive: true })){
                        console.log('La carpeta no estaba creada')
                        let data = '[CONFIGURATION] \
                                    output_dir=./morphkgc/output \
                                    output_file=result'
                        fs.writeFile('./morphkgc/config.ini', data, err => {
                            if (err) {
                                core.setFailed(error.message);
                            }
                        })
                    }
                    core.setOutput('run', true);
                    break;
            }
        }
    }
    catch (error){
        core.setFailed(error.message);
    }
}

// function returns a Promise
function get_promise(url) {
	return new Promise((resolve, reject) => {
		https.get(url, (response) => {
            if (response.statusCode !== 200) {
                    core.setFailed(`Did not get an OK from the server. Code: ${response.statusCode}, from petition to: \n`, url);
                    response.resume();
                    return;
            }
            
			let chunks_of_data = [];

			response.on('data', (fragments) => {
				chunks_of_data.push(fragments);
			});

			response.on('end', () => {
				let response_body = Buffer.concat(chunks_of_data);
				resolve(response_body.toString());
			});

			response.on('error', (error) => {
				reject(error);
			});
		});
	});
}


// async function to make http request
async function makeSynchronousRequest(url) {
	try {
		let http_promise = get_promise(url);
		let response_body = await http_promise;

		return response_body;
	}
	catch(error) {
		console.log(error);
	}
}

main();
