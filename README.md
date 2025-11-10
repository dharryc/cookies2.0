# Cookies Gift Registry!!!

This is a little toy site I've made that allows you to keep track of gifts, birthdays, and purchase status of items that family members (or others), would like to have for Holidays or birthdays!

## Users

- Username and Password
- Birthday
- List of items

## Items

- Link to the item (toggleable)
- Description or other notes
- Price range of item
- Purchased status (not viewable by the owner of the item)

## Families / Pods

- Contains users
- Items are added within the scope of a family and can only be viewed by other members of that family
- You can invite other users once you make a family

## Security features!

- password salting + hashing for authentication
- JWT on login for authorization
- Can only see families that you're a part of!

## How does it all work?

<p>
Users can log in and view their family(ies) through a navbar. When they view an individual family, items that other users have made visible in that family will be visable, as well as a toggleable button to mark an item as purchased. The user can also navigate to their item page, which will allow them to add a new item to their list, then change the visibility to include or exclude visibility across families that the user is a member of.of
</p>
<p>
Users can create new families from a create family page. In order to add a member to the family, the User will need to either share the family invite link (find some way to make that single use or temporary) or get the userid from other users. The owner of a family group will be able to edit the name of the family and remove members from the family.
</p>
<p>
Each item will contain either or both a link or a description that will describe or link to others what they want. They will also include a price range for the item so that other family members are able to sort by price category.
</p>

##

### Database Architecture

#### user table
- id pk
- username nn
- passwordHash nn
- salt nn
- birthday

#### price range table(?)
- id pk nn
- name nn

#### item table
- id pk
- user_id fk nn
- price range fk
- link
- description    <!-- Either link or description need to be not null, but either could be null -->
- purchased

#### Family table
- id pk
- family name nn

#### member in family table
- id pk
- userid fk nn
- familyid fk nn

#### item in family table
- id pk
- itemid fk nn
- familyid fk nn
- purchasedby fk (userid)