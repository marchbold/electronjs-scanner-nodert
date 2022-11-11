# Image Scanner Test Bed

Tests for accessing a photo scanner from an eletronjs application on Windows using nodert. 



### NodeRT

Small note on installing nodert storage:

https://github.com/NodeRT/NodeRT/issues/143

```
npm i --save @nodert-win10-rs4/windows.storage --ignore-scripts
```

Edit `node_modules\@nodert-win10-rs4\windows.storage\binding.gyp` adding the `"/bigobj"` option as below: 

```
"AdditionalOptions": ["/ZW", "/bigobj"],
```

then rebuild with:

```
npm rebuild @nodert-win10-rs4/windows.storage
```