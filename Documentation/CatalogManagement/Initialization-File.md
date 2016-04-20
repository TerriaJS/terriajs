
##Downloading the current initialization file

National Map (NM) is initialized with a JSON formatted text file.  JSON is a simple text based format for describing data web based data.  Changing the initialization of NM is simply a matter of changing the structured text in the file.

NM's current initialization file can be downloaded from http://nationalmap.nicta.com.au/init/nm.json.  After clicking on this link, you can save the JSON text that is returned to a file on your local system by right clicking on the page and selecting Save As.

Once you have a local file you can see how this works.  Starting with blank version of NM by going to http://nationalmap.nicta.com.au#clean and seeing that there are no datasets.  Now drag the file nm.json file you just downloaded onto National Map to see that the Data section is now populated and the camera jumps to Australia.

##Editing the file

You can edit this file directly in any text editor or you can use an online tool which will help manage the organization and syntax of the JSON text document.  A JSON editor is handy in that it will make sure to enforce the few rules that JSON has (matching quotes/brackets/braces, no extra commas), but it may be cumbersome to learn a new tool and editing it in your normal text editor works fine as long as you keep the text organized.

The initialization file consists of a few sections to initialize the view and server and then the catalog in an indented heirarchical format.  You can think of it as a table of contents.  

Go here for more information about the initialization file format...

####Your text editor

Load the nm.json file.

...

Save the file when you want to test it.


####Online JSON editor

Go to https://www.jsoneditoronline.org/

Select Open.Open from disk at the top right and select the nm.json file you downloaded

It will now be loaded in the editor and you should be able to see the text.  You can use the view on the right to change, add, or remove fields and sections with the action menu icons to the left each line.  If you make a mistake, undo and redo are available at the top of the page.

When you have something you want to try out, select Save.Save to disk at the top of the editor page.

This will download it in the browser.  Then depending on your browser go to the downloads folder and find the file that was just downloaded.  It's probably named something like nm (1).json.

##Testing

As described in the downloading section, start up nationalmap without any datasets using the link http://nationalmap.nicta.com.au#clean

And just drag the locally edited initialization file onto National Map.

If you look under Data, they will be populated with the entries from your file.

If you want others to be able to look at them you can send them the JSON file you created.


##Submit

When you are ready for this to go public it needs to be added to the master branch via github.  The next step is to create a pull request for the branch and it will go through the normal QA and deployment procedures for NM.

 - Create a new branch in the github project (locally or via the web interface).

 - Update the nm.json file in the branch.

 - Submit a pull request with the new nm.json file

 - When everyone is happy, the pull request can be merged into master.


