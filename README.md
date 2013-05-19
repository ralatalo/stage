# [Stage Framework](http://stageframework.com/)

Stage Framework is an experimental HTML5 and CSS3 framework for
digital magazine and newspaper publishing. It provides a web
application which features a magazine stand where users can browse
the published publications. The magazine browsing view relies
entirely on CSS3 3D transforms and transitions which makes the
framework highly experimental on certain platforms.

## Licensing

The framework itself is provided with either MIT or GPL license.
The licenses of major components are as follows:

* jQuery: MIT/GPL
* Modernizr: MIT/BSD
* Swipe.js: MIT/GPL
* LESS: Apache 2.0
* Normalize.css: Public Domain
* HTML5 Boilerplate: Public Domain

## Getting Started

This getting started guide is provided also on the framework [website](http://stageframework.com/).

### 1. Download Stage Framework

Download the framework as a zipball or clone the GitHub repository and place the framework resources on your web server of choice. We will go through some OS X and Apache 2 specific steps here. The steps regarding PHP, .htacess and SQLite are required by the dynamic HTML5 application cache technology. Unfortunately at the time being there is no easy way to opt-out (simply discarding the .htaccess file works to some extent).

###### Clone the GitHub repository with a terminal command:

```
git clone https://github.com/ralatalo/stage.git
```

### 2. Setup the server environment

#### Enable PHP module

###### Edit the httpd.conf file of Apache:

```
sudo nano /etc/apache2/httpd.conf
```

###### Uncomment the line (remove the #):

```
LoadModule php5_module libexec/apache2/libphp5.so
```

Write out the changes and exit nano by using control+o and control+x shortcuts.

#### Enable .htaccess files

Proceed this step if .htaccess files are not enabled by other means, for example with user specific .conf file.

###### Continue to edit the httpd.conf file:

```
sudo nano /etc/apache2/httpd.conf
```

###### Find the Directory tags for "/" and "/Library/WebServer/Documents" paths:

```
<Directory />
  …
	AllowOverride None
	…
</Directory>

<Directory "/Library/WebServer/Documents">
	…
	AllowOverride None
	…
</Directory>
```

###### Change the both AllowOverride None settings to AllowOverride All.

Write out the changes and exit nano by using control+o and control+x shortcuts.

#### Install the SQLite support for PHP

###### If SQLite is not enabled in your PHP setup, you can install it in OS X with a terminal command:

```
sudo port install php5-sqlite
```

#### Set the write access for SQLite database

###### The web server needs to write the SQLite database located in:

```
/cache/stage.sqlite
```

###### With using the PHP resource located in:

```
/cache/alter.php
```

###### The default database permissions are set open for everyone with:

```
chmod -R 777 cache/
```

However, the permissions are recommended to be set more strictly.

###### Give the write access by changing the folder and file groups to the web server (Apache) user:

```
chmod -R 755 cache/
chgrp -R _www cache/
```

#### Start (or restart) the Apache 2 web server

###### With one of the following commands:

```
sudo apachectl start
sudo apachectl restart
```

### 3. Setup your publications

#### Place your issue resources

The issue resources should be located in the **content** folder. Each publication should have their own folder, which contains all issues belonging to that publication. The following is an example of possible directory structure.

```
/content/stagemag/

/content/stagemag/2012-12/
/content/stagemag/2012-12/p1.html
/content/stagemag/2012-12/p2.html

/content/stagemag/2012-12/css/
/content/stagemag/2012-12/css/stagemag.css

/content/stagemag/2012-12/img/
/content/stagemag/2012-12/img/p1/
/content/stagemag/2012-12/img/p1/cover.png

/content/stagemag/2012-11/
...

/content/anothermag/
...


```

The content format should be HTML5 with some **restrictions**:

* External resources such as Web Fonts and JavaScript cannot be loaded at this time from 3rd party servers.
* CSS rem unit cannot be used as the content is placed inside the web app which changes the root element.
* There is a known bug considering the JavaScript execution when accessing the first page of an issue which makes the JavaScript run too early. Avoid relying on page styling with JavaScript on page load.

#### Modify the magazine stand JSON

The following is a minimal example of stand.json file located in the content folder.

```
{
  "publisher": [
    "Stage Framework"
  ],
  "content": [
    {
      "identifier": "books",
      "title": "Book Collection",
      "issues": [
        {
          "identifier": "b1",
          "title": "Letters of J.A.",
          "languages": [
            "en"
          ],
          "covers": {
            "high": "images/cover.jpg",
            "medium": "images/cover-2048.jpg",
            "small": "images/cover-1024.jpg"
          },
          "pages": [
            "p1.html",
            "p2.html"
          ]
        }
      ],
      "date": "2013-03-10"
    }
  ],
  "updated": "2013-03-10"
}
```

The most important part of the JSON is the *content* array of objects. It lists the available publications, in this case Book Collection which has an identifier "books". The identifier have to reflect the folder name in which the publication issues and their resources reside.
The issues array of objects lists all the published issues of that specific publication. An issue must include an identifier, which again reflects the folder name under the publication's main folder, a title, languages the issue is available in, three cover images for different screen sizes and the list of issue pages.

The pages are presented in the order they are listed in the *pages* array. The recommended (minimum) cover image sizes are *207x293* for the small, *414x586* for the medium and *735x1040* for the high resolution. The provided language values won't affect the publications at the time being.
