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
        let output_dir = core.getInput('output_dir', { required: false });
        let output_file = core.getInput('output_file', { required: false });
        let output_format = core.getInput('output_format', { required: false });
        let clean_output_dir = core.getInput('clean_output_dir', { required: false });
        let only_printable_characters = core.getInput('only_printable_characters', { required: false });
        let safe_percent_encoding = core.getInput('safe_percent_encoding', { required: false });
        let na_filter = core.getInput('na_filter', { required: false });
        let na_values = core.getInput('na_values', { required: false });
        let mapping_partition = core.getInput('mapping_partition', { required: false });
        let chunksize = core.getInput('chunksize', { required: false });
        let number_of_processes = core.getInput('number_of_processes', { required: false });
        let logging_level = core.getInput('logging_level', { required: false });
        let logging_file = core.getInput('logging_file', { required: false });

        if(output_dir){
            output_dir='output_dir=' + output_dir;
        }
        if(output_file){
            output_file='output_file=' + output_file;
        }
        if(output_format){
            output_format='output_format=' + output_format;
        }
        if(clean_output_dir){
            clean_output_dir='clean_output_dir=' + clean_output_dir;
        }
        if(only_printable_characters){
            only_printable_characters='only_printable_characters=' + only_printable_characters;
        }
        if(safe_percent_encoding){
            safe_percent_encoding='safe_percent_encoding=' + safe_percent_encoding;
        }
        if(na_filter){
            na_filter='na_filter=' + na_filter;
        }
        if(na_values){
            na_values='na_values=' + na_values;
        }
        if(mapping_partition){
            mapping_partition='mapping_partition=' + mapping_partition;
        }
        if(chunksize){
            chunksize='chunksize=' + chunksize;
        }
        if(number_of_processes){
            number_of_processes='number_of_processes=' + number_of_processes;
        }
        if(logging_level){
            logging_level='logging_level=' + logging_level;
        }
        if(logging_file){
            logging_file='logging_file=' + logging_file;
        }

        core.setOutput('run', false);

        // Instance of Octokit to call the API
        const octokit = new github.getOctokit(token);

        const { data: changedFiles } = await octokit.rest.pulls.listFiles({
            owner,
            repo,
            pull_number: pr_number,
        });

        if(fs.mkdirSync('./morphkgc/', { recursive: true })){
            let data = '[CONFIGURATION]\n#OUTPUT\n' + 
                        /* output optional parameters */
                        output_dir + '\n' + output_file + '\n' + output_format + '\n' + clean_output_dir + '\n' + only_printable_characters + '\n' + safe_percent_encoding + '\n\n#INPUT\n' +
                        /* input parameters */
                        na_filter + '\n' + na_values + '\n\n#MAPPINGS\n' +
                        /* mappings parameters */
                        mapping_partition + '\n\n#MATERIALIZATION\n' +
                        /* materialization parameters */
                        chunksize + '\n\n#MULTIPROCESSING\n' +
                        /* multiprocessing parameters */
                        number_of_processes + '\n\n#LOGS\n' +
                        /* logging parameters */
                        logging_level + '\n' + logging_file;
            fs.writeFile('./morphkgc/config.ini', data, err => {
                if (err) {
                    core.setFailed(error.message);
                }
            })
        }

        for (const file of changedFiles) {
            let fle = file.filename.split('.');
		    const file_extension = fle.pop();
            fle = fle.join('/').split('/').pop();

            switch (file_extension) {
                case 'json':
                case 'xml':
                case 'csv':
                case 'tsv':
                case 'xlsx':
                case 'parquet':
                case 'feather': 
                case 'orc': 
                case 'dta':
                case 'sas':
                case 'sav':
                case 'ods':
                    core.setOutput('run', true);
                    break;
            }
            switch (file_extension) {
                case 'r2rml':
                case 'rml':
                case 'ttl':
                    core.setOutput('run', true);
                    data = '\n\n[' + fle + ']\nmappings=./' + file.filename;
                    fs.appendFile('./morphkgc/config.ini',data,err => {
                        if (err) {
                            core.setFailed(error.message);
                        }
                    });
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
