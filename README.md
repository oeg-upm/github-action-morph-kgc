# github-action-morph-kgc
The goal of this action is to create a knowledge graph from structured or semi-structured sources using RML mappings and [morph-kgc](https://github.com/oeg-upm/morph-kgc).
## Considerations
The mapping file extension needs to be .rml.ttl or .rml.nt
## Usage
Create a `.github.workflows/[name].yaml` file in the repository.

Example workflow:
```
name: [name]
on:   
  push:
    branches:    
      - main
  pull_request:
    branches:    
      - main

jobs:    
  validate:
    runs-on: ubuntu-latest
    name: action-morphkgc
    steps:
      - name: checkout
        uses: actions/checkout@v2
        with:
          fetch-depth: 0

      - name: changes
        run: |
          git diff --name-only ${{ github.event.before }} ${{ github.event.after }}
          echo "::set-output name=CHANGES::$(git diff --name-only ${{ github.event.before }} ${{ github.event.after }})"
        id: "changes"

      - name: python version
        run: python --version

      - name: installing morph-kgc
        run: pip install morph-kgc

      - name: action-morphkgc
        uses: ./
        id: 'action-morphkgc'
        with:
          changes: ${{ steps.changes.outputs.CHANGES }}
          na_filter: 'yes'
          na_values: ',#N/A,N/A,#N/A N/A,n/a,NA,<NA>,#NA,NULL,null,NaN,nan,None'
          output_dir: 'morphkgc'
          output_file: 'result'
          output_format: 'N-QUADS'
          clean_output_dir: 'no'
          only_printable_characters: 'no'
          safe_percent_encoding: ':/'
          mapping_partition: 'PARTIAL-AGGREGATIONS'
          chunksize: '100000'
          logging_level: 'INFO'
          logging_file: 'logs'

      - name: running morph-kgc
        run: |
          if ${{ steps.action-morphkgc.outputs.run }}
          then
            python3 -m morph_kgc ./morph-kgc-exec/config.ini
            rm -r ./morph-kgc-exec
            git config --global user.name 'github-actions[bot]'
            git config --global user.email '41898282+github-actions[bot]@users.noreply.github.com'
            git add -A
            set +e
            git status | grep "nothing to commit, working tree clean"
            if [ $? -eq 0 ]; then set -e; echo "INFO: No changes since last run"; else set -e; \
              git commit -m "morph-kgc result for ${{ github.actor }} - ${{ github.event.number }}" --allow-empty; git push --force; fi
          fi

```
## Inputs
### `changes` (optional)
The changes in the commit, it is taken from an earlyer step named changes.
### `output_dir` (optional)
The output directory for morphkgc.
- `Default value`: output
### `output_file`  (optional)
File to write the results to. If it is empty (no value) then an independent output file is generated for each group of the mapping partition.

- `Default value`: result
### `output_format` (optional)
RDF serialization to use for output results.

- `Valid values`: N-TRIPLES, N-QUADS
- `Default value`: N-QUADS
### `clean_output_dir` (optional)
Remove everything from output_dir before starting with materialization.

- `Valid values`: yes, no, true, false, on, off, 1, 0
- `Default value`: no
### `only_printable_characters` (optional)
Remove characters in the genarated RDF that are not printable.

- `Valid values`: yes, no, true, false, on, off, 1, 0
- `Default value`: no
### `safe_percent_encoding` (optional)
Set of ASCII characters that should not be percent encoded. All characters are encoded by default.

- `Example value`: :/
- `Default value`:
### `na_filter` (optional)
If specified, the values from the option na_values will be interpreted as NULL.

- `Valid values`: yes, no, true, false, on, off, 1, 0
- `Default value`: yes
### `na_values` (optional)
Set of values to be interpreted as NULL when retrieving data from the input sources. The valid values are a list of values separated by commas.

- `Default value`: ,#N/A,N/A,#N/A N/A,n/a,NA,<NA>,#NA,NULL,null,NaN,nan,None
### `mapping_partition` (optional)
Mapping partitioning algorithm to use. Mapping partitioning can also be disabled.

- `Valid values`: PARTIAL-AGGREGATIONS, MAXIMAL, no, false, off, 0
- `Default value`: PARTIAL-AGGREGATIONS
### `chunksize` (optional)
Size of the chunks in which data is processed. Chunk processing is not supported for PARQUET, FEATHER, ORC and SPSS formats, for which chunksize will be ignored.

- `Default value`: 100000
### `number_of_processes` (optional)
The number of processes to use. If 1, multiprocessing is disabled.

- `Default value`: 2 * number of CPUs in the system
### `logging_level` (optional)
Sets the level of the log messages to show.

- `Valid values`: DEBUG, INFO, WARNING, ERROR, CRITICAL, NOTSET
- `Default value`: INFO
### `logging_file` (optional)
If not provided, log messages will be redirected to stdout. If a file path is provided, log messages will be written to file.

- `Default value`   :
## Outputs
### run
Tells the pipeline if morphkgc needs to be executed.
- `true` if there are changes
- `false` if there are not changes
