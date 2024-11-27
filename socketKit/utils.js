export let Online = [];

export const addUser = (data) => {
  const UserIn = Online.filter(
    (user) => user.currentUser.user_id == data.currentUser.user_id
  );

  if (UserIn.length) return;
  Online.push(data);
};

export const removeUser = (id) => {
  if (!id) return;
  Online = Online.filter((user) => user.socketId != id);
};
