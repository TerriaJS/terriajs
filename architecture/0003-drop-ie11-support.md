# 3. Drop support for Internet Explorer 11

Date: 2020-08-28

## Status

Superseded by [0010-never-support-ie11](./0010-never-support-ie11.md) on 2022-05-12

## Context

OSS Ticket

https://github.com/TerriaJS/terriajs/issues/4546

Developer community at large

- https://death-to-ie11.com/
- https://dev.to/samthor/what-to-expect-when-you-re-expecting-to-drop-ie11-ifg
- https://www.swyx.io/writing/ie11-eol/

~4 years ago, IE11 was very much alive and around. 3 years ago during our 'tech
upgrade',we decided to drop support for IE9+10.

Here we sit at the next tech upgrade (version 8). Mobx works in Chrome/FF/Edge,
Safari needs some work. Mobile interface isn't done for some of the newer
changes.

Some very brief benefits for dropping IE11:

- Benefits:
  - Easier UI work
  - Features (CSS grid, modules/prefetch)
  - Much less time spent debugging IE11
- Downsides:
  - Potential ~5% nationalmap audience

#### Questions

- How does this impact on the community? Any backlash if we drop IE11? We still
  get some community request/feedback on IE11

  - We've yet to gauge this, but there is movement at large for the community to
    drop support.
  - The community itself is going to run into more and more products and
    websites that do not support IE11.
  - Supporting something that even microsoft doesn't, isn't worth the effort for
    Terria.

- Perhaps one stance at the moment is to say it should work on IE11 but may not
  necessarily look as great
  - This seemed possible at the time of saying this, however the amount of IE11
    things we bash our heads against makes this seem unachievable

### Other extra background information

Product discussions

https://github.com/TerriaJS/product/issues/25

https://github.com/TerriaJS/product/issues/27

via @meh9

> - @here re Internet Explorer 11 support in Terria. it is my understanding that
>   IE11 would take a significant effort to support going forward (@steve9164
>   @soyarsauce etc, do chime in). the numbers below are usage for the last 2
>   months on NationalMap, and IE11 use is 4.7%. in my opinion we should drop
>   support for IE11 in Terria v8, and instead show a message suggesting other
>   browsers. it will affect a number of people. what does everyone think?

> - if Teams stop supporting it in November, then I think it’s perfectly
>   reasonable for us to say that Terria v8 is not going to support it. I think
>   that’s the decision, and we start communicating that to our stakeholders.

via @rowanwins

> +1 from me. I think there has been some discussions along these lines already

via @steve9164

> My view: The whole architecture and all the catalog items support IE11 but
> we're getting tripped up on development tools and styling (which we can fix,
> but any debugging needed in IE11 is becoming really expensive as Terria grows
> and IE11's debugger doesn't. Techniques we once used to debug - especially
> breaking on exceptions - are no longer viable due to the use of new packages
> like core-js polyfills and styled-components, both of which throw and catch
> their own exceptions to detect either browser capabilities or for
> styled-components the context in which a component is called in)

via @soyarsauce

> - yeah the debugging-in-ie11 is the big maintenance cost
> - i feel we are spread thin enough such that dropping official support would
>   do us a lot of good, one can always look at https://death-to-ie11.com/ & see
>   the big list of who has already done so
> - marie made another point when we last talked about this, "4.7%" or whatever
>   the ongoing ie11 usage number is both a huge and tiny number, for someone
>   like `BIG_CORPORATE` they have the $ and resources ( & business case ) to
>   save 0.5% of their users. we don't have that luxury
> - not withstanding the fact that we're still talking official support,
>   terriajs is open source and the community can always carry that load if they
>   really want to make v8 work in ie11 - it kind of did up until recently, and
>   it's just going to be back and forth between "it's broken" to "community
>   puts the small fix to whatever broke it last"

via @KeyboardSounds

> I still want to know who might be affected by it because if it’s
> overwhelmingly a marginalised demographic, then maybe we should support it out
> of the goodness of our hearts but if it’s people using their work computers then
> :shrug:

### Options

Our options laid out by @steve9164

1. Drop IE11 completely with no view of ever going back on that decision. We
   upgrade to latest MobX, add service workers, use WASM, etc.

2. Continue the status quo. I.e. mostly ignore how TerriaJS v8 works on IE11.
   Everything that runs in tests will run on IE11 VMs so the functionality
   works, but the presentation is broken. We can (within a week) reinstate IE11
   as a supported browser if we decide so in the future. Until we make the
   decision to completely drop support we can't add newer technologies to
   TerriaJS.

3. Support IE11. We spend a week before the next TerriaJS v8 release to work on
   all the layout problems and ensure it looks nice in IE11 before each
   subsequent release.
4. Deprecate IE11 support ASAP. Add dismissable message to maps warning them
   that on November 1, users will be unable to use new releases of Terria maps
   in IE11. During the deprecation window, we will not use features that IE11
   doesn't support. On November 1, new releases of Terria maps will display a
   message to IE11 users asking them to switch to another browser. They will
   not be able to use Terria in IE. Both messages will include a way for users
   to send us feedback so that we can assess the impact.

## Decision

We go with option number 4. Terria v8 is **not going to support IE11**.

Given the amount of products and websites out there who are dropping IE11
support, and the wider movement to drop IE11, **including Microsoft** themselves
in the near future for Teams and its 365 products:

https://techcommunity.microsoft.com/t5/microsoft-365-blog/microsoft-365-apps-say-farewell-to-internet-explorer-11-and/ba-p/1591666

The advantage of option 4 over option 1 is that it gives users more notice
on the change, and gives us more of a chance to assess the impact.

## Consequences

- Make wider announcements, as part of the general v8 community announcements.
  - This includes announcements in new releases of maps themselves.
- Include an "upgrade your browser" / "try these browsers" notice when IE11
  tries to use v8 Terria.
- Users using IE11 will not be able to run Terria
- Development won't be burdened by IE11 quirks
